import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Plus, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getConfig, getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { DEFAULT_TEMPLATES } from "@/components/templates/registry";
import { CreateResumeModal } from "./CreateResumeModal";
import { ImportResumeDialog } from "./ImportResumeDialog";
import { ResumeCardItem } from "./ResumeCardItem";
import { AnimatedImportButton } from "./AnimatedImportButton";

export const ResumeWorkbench = () => {
    const t = useTranslations();
    const locale = useLocale();
    const {
        resumes,
        setActiveResume,
        updateResumeFromFile,
        addResume,
        deleteResume,
        createResume,
    } = useResumeStore();
    const router = useRouter();
    const [hasConfiguredFolder, setHasConfiguredFolder] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const syncResumesFromFiles = async () => {
            try {
                const handle = await getFileHandle("syncDirectory");
                if (!handle) return;

                const hasPermission = await verifyPermission(handle);
                if (!hasPermission) return;

                const dirHandle = handle as FileSystemDirectoryHandle;

                for await (const entry of (dirHandle as any).values()) {
                    if (entry.kind === "file" && entry.name.endsWith(".json")) {
                        try {
                            const file = await entry.getFile();
                            const content = await file.text();
                            const resumeData = JSON.parse(content);
                            updateResumeFromFile(resumeData);
                        } catch (error) {
                            console.error("Error reading resume file:", error);
                        }
                    }
                }
            } catch (error) {
                console.error("Error syncing resumes from files:", error);
            }
        };

        if (Object.keys(resumes).length === 0) {
            syncResumesFromFiles();
        }
    }, [resumes, updateResumeFromFile]);

    useEffect(() => {
        const loadSavedConfig = async () => {
            try {
                const handle = await getFileHandle("syncDirectory");
                const path = await getConfig("syncDirectoryPath");
                if (handle && path) {
                    setHasConfiguredFolder(true);
                }
            } catch (error) {
                console.error("Error loading saved config:", error);
            }
        };

        loadSavedConfig();
    }, []);

    const handleCreateFromModal = (templateId: string | null) => {
        const isBlank = !templateId;
        const newId = createResume(templateId, isBlank);

        if (templateId) {
            const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
            if (template) {
                const { resumes, updateResume } = useResumeStore.getState();
                const resume = resumes[newId];
                if (resume) {
                    updateResume(newId, {
                        globalSettings: {
                            ...resume.globalSettings,
                            themeColor: template.colorScheme.primary,
                            sectionSpacing: template.spacing.sectionGap,
                            paragraphSpacing: template.spacing.itemGap,
                            pagePadding: template.spacing.contentPadding,
                        },
                        basic: {
                            ...resume.basic,
                            layout: template.basic.layout,
                        },
                    });
                }
            }
        }

        setIsCreateModalOpen(false);
        setActiveResume(newId);
        router.push(`/app/workbench/${newId}`);
    };

    const importResumeFromJson = async (file: File) => {
        const content = await file.text();
        const config = JSON.parse(content);
        const now = new Date().toISOString();
        const { generateUUID } = await import("@/utils/uuid");
        const { initialResumeState } = await import("@/config/initialResumeData");

        const newResume = {
            ...initialResumeState,
            ...config,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
        };
        const resumeId = addResume(newResume);
        setActiveResume(resumeId);
        setIsImportDialogOpen(false);
        toast.success(t("dashboard.resumes.importSuccess"));
        router.push(`/app/workbench/${resumeId}`);
    };

    const handleJsonFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || isImporting) return;

        try {
            setIsImporting(true);
            await importResumeFromJson(file);
        } catch (error) {
            console.error("Import JSON error:", error);
            toast.error(t("dashboard.resumes.importError"));
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto">
            <div className="flex-1 space-y-6 px-6 pb-8 pt-8">
                <div className="flex w-full items-center justify-center">
                    {hasConfiguredFolder ? (
                        <Alert className="mb-6 bg-green-50/50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                            <AlertDescription className="flex items-center justify-between">
                                <span className="text-green-700 dark:text-green-400">
                                    {t("dashboard.resumes.synced")}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-4 hover:bg-green-100 dark:hover:bg-green-900"
                                    onClick={() => {
                                        router.push("/settings");
                                    }}
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    {t("dashboard.resumes.view")}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert
                            variant="destructive"
                            className="mb-6 bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("dashboard.resumes.notice.title")}</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                <span className="text-red-700 dark:text-red-400">
                                    {t("dashboard.resumes.notice.description")}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="ml-4 hover:bg-red-100 dark:hover:bg-red-900"
                                    onClick={() => {
                                        router.push("/settings");
                                    }}
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    {t("dashboard.resumes.notice.goToSettings")}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        {t("dashboard.resumes.myResume")}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <AnimatedImportButton onClick={() => setIsImportDialogOpen(true)} t={t} />
                        <div>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                variant="default"
                                className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("dashboard.resumes.create")}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                        <div
                            className="transition-transform hover:scale-[1.01] active:scale-[0.99]"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <Card
                                className={cn(
                                    "relative border border-dashed cursor-pointer transition-all duration-200 aspect-[210/297] flex flex-col",
                                    "hover:border-gray-400 hover:bg-gray-50",
                                    "dark:hover:border-primary dark:hover:bg-primary/10"
                                )}
                            >
                                <CardContent className="flex-1 p-0 text-center flex flex-col items-center justify-center">
                                    <div className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-primary/10 transition-transform hover:rotate-90">
                                        <Plus className="h-8 w-8 text-gray-600 dark:text-primary" />
                                    </div>
                                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100 px-4">
                                        {t("dashboard.resumes.newResume")}
                                    </CardTitle>
                                    <CardDescription className="mt-2 text-gray-600 dark:text-gray-400 px-4">
                                        {t("dashboard.resumes.newResumeDescription")}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </div>

                        {Object.entries(resumes)
                            .sort(([, a], [, b]) => {
                                const dateA = new Date(a.createdAt || 0).getTime();
                                const dateB = new Date(b.createdAt || 0).getTime();
                                return dateB - dateA;
                            })
                            .map(([id, resume], index) => (
                                <ResumeCardItem
                                    key={id}
                                    id={id}
                                    resume={resume}
                                    t={t}
                                    locale={locale}
                                    setActiveResume={setActiveResume}
                                    router={router}
                                    deleteResume={deleteResume}
                                    index={index}
                                />
                            ))}
                    </div>
                </div>

                <CreateResumeModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                    onCreate={handleCreateFromModal}
                />

                <ImportResumeDialog
                    open={isImportDialogOpen}
                    isImporting={isImporting}
                    onOpenChange={setIsImportDialogOpen}
                    jsonFileInputRef={jsonFileInputRef}
                    onJsonFileChange={handleJsonFileChange}
                />
            </div>
        </div>
    );
};
