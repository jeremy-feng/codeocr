"use client";

import { useState, useEffect } from "react";
import { Upload, Image, Typography } from "antd";
import type { UploadProps, UploadFile } from "antd";
import {
  InboxOutlined,
  FileImageOutlined,
  HddOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const { Text, Title } = Typography;

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUpload({
  onFileSelect,
  onRemoveFile,
  selectedFile,
  disabled = false,
}: ImageUploadProps) {
  const t = useTranslations("ImageUpload");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Update fileList when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      const uploadFile: UploadFile = {
        uid: "-1",
        name: selectedFile.name,
        status: "done",
        url: URL.createObjectURL(selectedFile),
        originFileObj: selectedFile as any,
      };
      setFileList([uploadFile]);
    } else {
      setFileList([]);
    }
  }, [selectedFile]);

  const validateFile = (file: File): boolean => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t("errorInvalidFormat"));
      return false;
    }

    if (file.size > MAX_SIZE) {
      toast.error(t("errorFileSize"));
      return false;
    }

    return true;
  };

  const handleFileChange = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleFileChange(file);
          }
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [disabled, handleFileChange]);

  const handleUploadChange: UploadProps["onChange"] = (info) => {
    const { fileList } = info;
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      if (file) {
        handleFileChange(file);
      }
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj as File);
      reader.onload = () => {
        file.preview = reader.result as string;
        setPreviewImage(file.preview);
        setPreviewOpen(true);
      };
    } else {
      setPreviewImage(file.url || (file.preview as string));
      setPreviewOpen(true);
    }
  };

  const handleRemove = () => {
    onRemoveFile();
  };

  if (selectedFile) {
    return (
      <div className="w-full">
        <div className="flex justify-start">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            onRemove={handleRemove}
            showUploadList={{
              showPreviewIcon: true,
              showRemoveIcon: true,
            }}
          />
        </div>
        {previewImage && (
          <Image
            wrapperStyle={{ display: "none" }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(""),
            }}
            src={previewImage}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Upload.Dragger
        name="file"
        multiple={false}
        fileList={[]}
        onChange={handleUploadChange}
        beforeUpload={() => false}
        accept={ACCEPTED_TYPES.join(",")}
        disabled={disabled}
        className="w-full"
        style={{ minHeight: "200px" }}
      >
        <div className="flex flex-col items-center justify-center px-6 py-8 w-full min-h-[168px]">
          <InboxOutlined
            className="mb-4 text-muted-foreground"
            style={{ fontSize: 36 }}
          />

          <div className="flex flex-col items-center gap-2 text-center w-full">
            <Title
              level={4}
              className="!mb-0 !text-foreground !text-base !leading-tight"
            >
              {t("title")}
            </Title>
            <Text className="text-sm text-muted-foreground">
              {t("subtitle")}
            </Text>
          </div>
          <div className="flex items-center justify-center gap-3 mt-4 text-center">
            <Text className="text-xs flex items-center gap-1 text-muted-foreground">
              <FileImageOutlined /> {t("supportedFormats")}
            </Text>
            <Text className="text-xs flex items-center gap-1 text-muted-foreground">
              <HddOutlined /> {t("maxSize")}
            </Text>
          </div>
        </div>
      </Upload.Dragger>
    </div>
  );
}
