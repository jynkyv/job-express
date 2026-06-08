import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BrainCircuit,
  ExternalLink,
  FlaskConical,
  Folder,
  HardDrive,
  LockKeyhole,
  ScanFace,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import {
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission,
} from "@/utils/fileSystem";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState("");
  const [activeTab, setActiveTab] = useState("backup");
  const {
    deepseekApiKey,
    deepseekModelId,
    qwenApiKey,
    qwenModelId,
    speechProvider,
    mockAIEnabled,
    setDeepseekApiKey,
    setDeepseekModelId,
    setQwenApiKey,
    setQwenModelId,
    setSpeechProvider,
    setMockAIEnabled,
  } = useAIConfigStore();

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "ai" || hash === "privacy") {
      setActiveTab(hash);
    }
  }, []);

  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        const path = await getConfig("syncDirectoryPath");

        if (handle && path && await verifyPermission(handle)) {
          setDirectoryHandle(handle as FileSystemDirectoryHandle);
          setFolderPath(path);
        }
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    };

    loadSavedConfig();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", value === "backup" ? "/settings" : `/settings#${value}`);
  };

  const handleSelectDirectory = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        alert("当前浏览器不支持目录选择，请使用最新版 Chrome 或 Edge。");
        return;
      }

      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      if (await verifyPermission(handle)) {
        setDirectoryHandle(handle);
        setFolderPath(handle.name);
        await storeFileHandle("syncDirectory", handle);
        await storeConfig("syncDirectoryPath", handle.name);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const handleRemoveDirectory = async () => {
    try {
      setDirectoryHandle(null);
      setFolderPath("");
      await storeFileHandle("syncDirectory", null as any);
      await storeConfig("syncDirectoryPath", "");
    } catch (error) {
      console.error("Error removing directory:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Job Express" className="size-10 object-contain" />
            <div>
              <p className="text-sm font-bold">Job Express</p>
              <p className="text-xs text-slate-500">求职准备套件</p>
            </div>
          </Link>
          <Button asChild variant="ghost" className="rounded-full text-slate-600">
            <Link to="/">
              <ArrowLeft className="mr-2 size-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-700">套件设置</p>
          <h1 className="mt-2 text-3xl font-bold">统一管理本地数据与 AI 服务</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            简历、模拟训练和形象分析共用这一处配置。密钥仅保存在当前浏览器中，不会写入简历文件。
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
          <TabsList className="grid h-12 w-full max-w-xl grid-cols-3 rounded-xl bg-slate-200/70 p-1">
            <TabsTrigger value="backup" className="rounded-lg">数据与备份</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg">AI 服务</TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg">隐私与导出</TabsTrigger>
          </TabsList>

          <TabsContent value="backup" className="mt-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                    <Folder className="size-6" />
                  </div>
                  <div>
                    <CardTitle>简历同步目录</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      默认数据保存在当前浏览器。授权本地文件夹后，简历会额外同步为 JSON 备份文件。
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-500">
                  <HardDrive className="size-5 text-slate-400" />
                  {folderPath || "尚未配置同步文件夹"}
                </div>
                <Button onClick={handleSelectDirectory} className="h-12 rounded-xl px-6">
                  选择文件夹
                </Button>
                {directoryHandle && (
                  <Button
                    onClick={handleRemoveDirectory}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-xl text-red-500"
                    title="移除同步目录"
                  >
                    <Trash2 className="size-5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6 space-y-5">
            <Card className={mockAIEnabled ? "border-amber-200 bg-amber-50/70 shadow-sm" : "border-slate-200 shadow-sm"}>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={mockAIEnabled ? "rounded-xl bg-amber-100 p-3 text-amber-700" : "rounded-xl bg-slate-100 p-3 text-slate-600"}>
                      <FlaskConical className="size-6" />
                    </div>
                    <div>
                      <CardTitle>开发模拟模式</CardTitle>
                      <CardDescription className="mt-2 max-w-3xl leading-6">
                        DeepSeek 或通义千问临时不可用时，开启后会使用本地示例数据跑通简历生成、模拟面试、照片校验和形象分析流程。此模式不会请求线上 AI 服务，结果仅用于开发和演示。
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    <span>{mockAIEnabled ? "已开启" : "已关闭"}</span>
                    <Switch checked={mockAIEnabled} onCheckedChange={setMockAIEnabled} aria-label="切换开发模拟模式" />
                  </div>
                </div>
              </CardHeader>
              {mockAIEnabled && (
                <CardContent className="pt-0">
                  <div className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-sm leading-6 text-amber-800">
                    当前会绕过 API 密钥校验。恢复 DeepSeek / 通义千问后，关闭此开关即可回到真实模型。
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <BrainCircuit className="size-6" />
                  </div>
                  <div>
                    <CardTitle>DeepSeek</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      用于简历润色、语法检查和模拟训练。Flash 更快、更经济；Pro 更适合需要深度分析的内容。
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="deepseek-key">API 密钥</Label>
                    <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-700 hover:underline">
                      获取密钥 <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <Input id="deepseek-key" type="password" value={deepseekApiKey} onChange={(event) => setDeepseekApiKey(event.target.value)} placeholder="sk-..." />
                </div>
                <div className="space-y-2">
                  <Label>模型</Label>
                  <Select value={deepseekModelId} onValueChange={setDeepseekModelId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deepseek-v4-flash">DeepSeek V4 Flash（推荐日常使用）</SelectItem>
                      <SelectItem value="deepseek-v4-pro">DeepSeek V4 Pro（深度分析）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                    <ScanFace className="size-6" />
                  </div>
                  <div>
                    <CardTitle>通义千问视觉模型</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      用于职业形象照片分析。默认选择 Plus 以获得更稳定的图片理解效果；Flash 适合降低成本。
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-2">
                  <Label htmlFor="qwen-key">DashScope API 密钥</Label>
                  <Input id="qwen-key" type="password" value={qwenApiKey} onChange={(event) => setQwenApiKey(event.target.value)} placeholder="sk-..." />
                </div>
                <div className="space-y-2">
                  <Label>视觉模型</Label>
                  <Select value={qwenModelId} onValueChange={setQwenModelId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qwen3.6-plus">qwen3.6-plus（推荐，效果优先）</SelectItem>
                      <SelectItem value="qwen3.6-flash">qwen3.6-flash（经济模式）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>语音识别</Label>
                  <Select value={speechProvider} onValueChange={(value: "browser" | "dashscope") => setSpeechProvider(value)}>
                    <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">浏览器内置识别（免费，无需配置）</SelectItem>
                      <SelectItem value="dashscope">DashScope 录音转写（复用通义千问密钥）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="mt-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <LockKeyhole className="size-6" />
                  </div>
                  <div>
                    <CardTitle>数据使用说明</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      简历和 API 密钥默认保存在当前浏览器。使用 AI 功能时，相关文本或照片会发送到所选服务商。保存 PDF 使用浏览器本地打印能力，不会把简历内容发送到额外的 PDF 服务。
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default SettingsPage;
