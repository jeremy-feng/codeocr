"use client";

import APISettingsDialog, {
  APISettingsDialogRef,
} from "@/components/APISettingsDialog";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BundledLanguage } from "@/components/ui/kibo-ui/code-block";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockFiles,
  CodeBlockHeader,
  CodeBlockItem,
} from "@/components/ui/kibo-ui/code-block";
import { Loader2, ScanText, Code, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState, useRef } from "react";
import { toast } from "sonner";

interface CodeOCRResponse {
  code: string;
}

interface APISettings {
  apiKey: string;
  apiBase: string;
  modelName: string;
}

export default function CodeOCRApp() {
  const t = useTranslations("CodeOCR");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CodeOCRResponse | null>(null);
  const [partialContent, setPartialContent] = useState("");
  const [apiSettings, setApiSettings] = useState<APISettings>({
    apiKey: "",
    apiBase: "",
    modelName: "",
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiSettingsDialogRef = useRef<APISettingsDialogRef>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
  }, []);

  const processImage = useCallback(async () => {
    if (!selectedFile) {
      toast.error(t("selectImageFirst"));
      return;
    }

    setIsProcessing(true);
    setResult(null);
    setPartialContent("");

    abortControllerRef.current = new AbortController();

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("api_key", apiSettings.apiKey);
        formData.append("api_base", apiSettings.apiBase);
        formData.append("model_name", apiSettings.modelName);

        const response = await fetch("/api/codeocr", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          if (response.status === 400) {
            const errorData = await response.json();
            if (
              errorData.error &&
              errorData.error.includes("API key is required")
            ) {
              toast.error(t("apiKeyRequired"));
              apiSettingsDialogRef.current?.openDialog();
              return;
            }
            if (
              errorData.error &&
              errorData.error.includes("Model name is required")
            ) {
              toast.error(t("apiKeyRequired"));
              apiSettingsDialogRef.current?.openDialog();
              return;
            }
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No reader available");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "content") {
                  accumulated += data.content;
                  setPartialContent(accumulated);
                } else if (data.type === "complete") {
                  setResult({ code: accumulated });
                  toast.success(t("extractSuccess"));
                  break;
                } else if (data.type === "error") {
                  throw new Error(data.content);
                }
              } catch (e) {
                console.error("Error parsing data:", e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          toast.info("Processing cancelled");
        } else {
          const errorMessage =
            err instanceof Error ? err.message : t("extractFailed");
          toast.error(errorMessage);
          setResult({
            code: `\`\`\`text\n--- ERROR ---\n${errorMessage}\n\`\`\``,
          });
        }
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    };
    reader.onerror = () => {
      toast.error(t("imageReadFailed"));
      setIsProcessing(false);
    };
  }, [selectedFile, apiSettings, t]);

  const stopProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const parseCodeBlock = (rawCode: string | undefined) => {
    if (!rawCode) {
      return { language: "text", code: "" };
    }
    const match = rawCode.match(/^```(\w+)\n([\s\S]*)\n```$/);
    if (match) {
      return { language: match[1], code: match[2] };
    }
    return { language: "text", code: rawCode };
  };

  const displayContent = partialContent || result?.code;
  const { language, code } = parseCodeBlock(displayContent);
  const finalCode = code || displayContent;

  return (
    <div className="w-full space-y-4">
      <Card className="shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <ImageUpload
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              selectedFile={selectedFile}
              disabled={isProcessing}
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="w-full sm:w-auto">
                <APISettingsDialog
                  ref={apiSettingsDialogRef}
                  onSettingsChange={setApiSettings}
                />
              </div>

              <div className="flex gap-2 w-full sm:flex-1">
                <Button
                  onClick={processImage}
                  disabled={!selectedFile || isProcessing}
                  className="flex-1"
                  size="default"
                  variant="default"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <ScanText className="mr-2 h-4 w-4" />
                      {t("extractCode")}
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <Button
                    onClick={stopProcessing}
                    variant="destructive"
                    size="default"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {displayContent && finalCode ? (
        <CodeBlock
          data={[
            {
              language: language,
              filename: "",
              code: finalCode,
            },
          ]}
          value={language}
          defaultValue={language}
        >
          <CodeBlockHeader>
            <CodeBlockFiles>
              {(item) => (
                <CodeBlockFilename key={item.language} value={item.language}>
                  <div className="flex items-center gap-2">
                    <Code /> {t("extractedCode")}
                    {isProcessing && (
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                    )}
                  </div>
                </CodeBlockFilename>
              )}
            </CodeBlockFiles>
            <CodeBlockCopyButton value={finalCode} />
          </CodeBlockHeader>
          <CodeBlockBody>
            {(item) => (
              <CodeBlockItem key={item.language} value={item.language}>
                <CodeBlockContent language={item.language as BundledLanguage}>
                  {item.code}
                </CodeBlockContent>
              </CodeBlockItem>
            )}
          </CodeBlockBody>
        </CodeBlock>
      ) : null}

      {/* No code message */}
      {result && !code && (
        <div className="border rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
          {t("noCodeDetected")}
        </div>
      )}
    </div>
  );
}
