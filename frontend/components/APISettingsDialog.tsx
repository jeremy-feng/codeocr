"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { toast } from "sonner";

interface APISettings {
  apiKey: string;
  apiBase: string;
  modelName: string;
}

interface APISettingsDialogProps {
  onSettingsChange: (settings: APISettings) => void;
}

export interface APISettingsDialogRef {
  openDialog: () => void;
}

function getUserSettings(): APISettings {
  try {
    const saved = localStorage.getItem("codeocr-api-settings");
    if (saved) {
      const userSettings = JSON.parse(saved);
      return {
        apiKey: userSettings.apiKey || "",
        apiBase: userSettings.apiBase || "",
        modelName: userSettings.modelName || "",
      };
    }
  } catch (error) {
    console.error("Failed to parse saved settings:", error);
  }

  return {
    apiKey: "",
    apiBase: "",
    modelName: "",
  };
}

const APISettingsDialog = forwardRef<
  APISettingsDialogRef,
  APISettingsDialogProps
>(({ onSettingsChange }, ref) => {
  const t = useTranslations("APISettings");
  const [open, setOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<APISettings>({
    apiKey: "",
    apiBase: "",
    modelName: "",
  });

  useImperativeHandle(ref, () => ({
    openDialog: () => setOpen(true),
  }));

  useEffect(() => {
    const userSettings = getUserSettings();
    setSettings(userSettings);
    onSettingsChange(userSettings);
  }, [onSettingsChange]);

  const handleSave = () => {
    if (!settings.apiKey.trim() || !settings.modelName.trim()) {
      toast.error(t("allFieldsRequired"));
      return;
    }

    try {
      localStorage.setItem("codeocr-api-settings", JSON.stringify(settings));
      onSettingsChange(settings);
      toast.success(t("settingsSaved"));
      setOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settingsFailed"));
    }
  };

  const handleInputChange = (field: keyof APISettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="w-full sm:w-auto">
          <Settings className="mr-2 h-4 w-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-4 sm:mx-0 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="apiKey">{t("apiKey")}</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder={t("apiKeyPlaceholder")}
                value={settings.apiKey}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiBase">{t("apiBase")}</Label>
            <Input
              id="apiBase"
              placeholder={t("apiBasePlaceholder")}
              value={settings.apiBase}
              onChange={(e) => handleInputChange("apiBase", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="modelName">{t("modelName")}</Label>
            <Input
              id="modelName"
              placeholder={t("modelNamePlaceholder")}
              value={settings.modelName}
              onChange={(e) => handleInputChange("modelName", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

APISettingsDialog.displayName = "APISettingsDialog";

export default APISettingsDialog;
