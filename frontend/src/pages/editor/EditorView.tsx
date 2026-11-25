import React from "react";
import type { DrawingSnapshotFull } from "../../api";
import { HistoryPreviewCanvas } from "./HistoryPreviewCanvas";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import clsx from "clsx";
import { Toaster } from "sonner";
import { LanguageSelector } from "../../components/LanguageSelector";
import { GridStepSelector } from "../../components/GridStepSelector";
import { ShareModal } from "../../components/ShareModal";
import { UIOptions, validateEmbeddableUrl } from "./shared";
import {
  EditorActionsIsland,
  EditorOverflowIsland,
  EditorTitleIsland,
  type EditorChromeProps,
} from "./EditorChrome";
import {
  SIDE_ISLAND_MAX_WIDTH,
  type EditorChromeLayout,
} from "./useEditorChrome";
import { canShare } from "./editorChromeRules";

type EditorViewProps = EditorChromeProps & {
  chromeLayout: EditorChromeLayout;
  historyButtonRef: React.RefObject<HTMLButtonElement>;
  shareButtonRef: React.RefObject<HTMLButtonElement>;
  editorContainerRef: React.RefObject<HTMLDivElement>;
  initialData: any;
  isHistoryOpen: boolean;
  historyPreview: DrawingSnapshotFull | null;
  isSceneLoading: boolean;
  langCode: string;
  loadError: string | null;
  theme: string;
  onCanvasChange: (
    elements: readonly any[],
    appState: any,
    files?: Record<string, any>,
  ) => void;
  onCanvasDropCapture: (event: React.DragEvent<HTMLDivElement>) => void;
  onLibraryChange: (items: readonly any[]) => void;
  onNavigateHome: () => void;
  onPointerUpdate: (payload: any) => void;
  onSetExcalidrawAPI: (api: any) => void;
  onSetLangCode: (langCode: string) => void;
  gridStep: number;
  onSetGridStep: (gridStep: number) => void;
  isShareOpen: boolean;
  onCloseShare: () => void;
  onToggleTheme: () => void;
};

export const EditorView: React.FC<EditorViewProps> = ({
  historyButtonRef,
  shareButtonRef,
  ...chrome
}) => {
  const {
    id,
    canEdit,
    chromeLayout,
    drawingName,
    editorContainerRef,
    initialData,
    isHistoryOpen,
    historyPreview,
    isSceneLoading,
    langCode,
    loadError,
    theme,
    onCanvasChange,
    onCanvasDropCapture,
    onLibraryChange,
    onNavigateHome,
    onPointerUpdate,
    onSetExcalidrawAPI,
    onSetLangCode,
    gridStep,
    onSetGridStep,
    isShareOpen,
    onCloseShare,
    onToggleTheme,
  } = chrome;
  // Below Excalidraw's own UI (z 4: sidebars, panels) normally; above the history preview (z-20) while it is shown.
  const chromeZ = historyPreview ? "z-[25]" : "z-[3]";
  const actionsIsland = (
    <EditorActionsIsland
      {...chrome}
      historyButtonRef={historyButtonRef}
      shareButtonRef={shareButtonRef}
    />
  );
  // The preview canvas covers Excalidraw's top-right slot, so the wide actions move into our own raised layer;
  // the preview only shows in view mode, where that slot sits at top/right 16px.
  const actionsOverPreview = chromeLayout === "wide" && Boolean(historyPreview);

  return (
    <div
      data-editor-root
      className="h-dvh bg-white dark:bg-neutral-950 overflow-hidden"
      onKeyDownCapture={(event) => {
        if (event.altKey && event.shiftKey && event.code === "KeyD") {
          event.preventDefault();
          event.stopPropagation();
          onToggleTheme();
        }
      }}
    >
      {canShare(chrome) && id ? (
        <ShareModal
          drawingId={id}
          drawingName={drawingName}
          isOpen={isShareOpen}
          onClose={onCloseShare}
          anchorRef={shareButtonRef}
        />
      ) : null}
      <div
        ref={editorContainerRef}
        className="relative h-full w-full"
        onDropCapture={(event) => {
          if (isHistoryOpen) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onCanvasDropCapture(event);
        }}
      >
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-950 px-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Unable to open drawing
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {loadError}
              </p>
            </div>
            <button
              onClick={onNavigateHome}
              className="ui-button-secondary px-4"
            >
              Back to dashboard
            </button>
          </div>
        ) : initialData ? (
          <Excalidraw
            key={id}
            theme={theme === "dark" ? "dark" : "light"}
            langCode={langCode}
            initialData={initialData}
            onChange={onCanvasChange}
            onPointerUpdate={onPointerUpdate}
            onLibraryChange={onLibraryChange}
            excalidrawAPI={onSetExcalidrawAPI}
            UIOptions={UIOptions}
            validateEmbeddable={validateEmbeddableUrl}
            viewModeEnabled={!canEdit || isHistoryOpen}
            renderTopRightUI={(isMobile) =>
              // Only the wide layout has visible history/share buttons for popovers to anchor to;
              // otherwise the refs stay empty and the popovers use their default top-right spot.
              !isMobile && chromeLayout === "wide" && !actionsOverPreview
                ? actionsIsland
                : null
            }
          >
            <MainMenu>
              <MainMenu.Item onSelect={onToggleTheme} shortcut="Shift+Alt+D">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </MainMenu.Item>
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
              <MainMenu.DefaultItems.Help />
              <MainMenu.Separator />
              <MainMenu.ItemCustom>
                <GridStepSelector
                  gridStep={gridStep}
                  onChange={onSetGridStep}
                />
              </MainMenu.ItemCustom>
              <MainMenu.ItemCustom>
                <LanguageSelector
                  langCode={langCode}
                  onChange={onSetLangCode}
                />
              </MainMenu.ItemCustom>
            </MainMenu>
          </Excalidraw>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="text-sm font-medium">
              {isSceneLoading ? "Loading drawing..." : "Preparing canvas..."}
            </span>
          </div>
        )}
        {historyPreview ? (
          <HistoryPreviewCanvas
            snapshot={historyPreview}
            theme={theme}
            langCode={langCode}
          />
        ) : null}
        {actionsOverPreview ? (
          <div className={clsx("absolute right-4 top-4", chromeZ)}>
            {actionsIsland}
          </div>
        ) : null}
        {!loadError &&
        (chromeLayout === "wide" || chromeLayout === "narrow") ? (
          <div
            className={clsx(
              // Right of Excalidraw's menu button, never into its ~550px centered tool row.
              "absolute left-[60px] top-4",
              chromeZ,
            )}
            style={{ maxWidth: SIDE_ISLAND_MAX_WIDTH }}
          >
            <EditorTitleIsland
              {...chrome}
              showTitle={chromeLayout === "wide"}
            />
          </div>
        ) : null}
        {!loadError && chromeLayout !== "wide" ? (
          <div
            className={clsx(
              chromeLayout === "mobile"
                ? // shortcut: clears Excalidraw's ~50px mobile bottom bar and 36px right tool column; measure them if they change.
                  "absolute bottom-[72px] right-[56px]"
                : "absolute bottom-4 right-[60px]",
              chromeZ,
            )}
          >
            <EditorOverflowIsland
              {...chrome}
              showBack={chromeLayout !== "narrow"}
            />
          </div>
        ) : null}
        <Toaster position="bottom-center" />
      </div>
    </div>
  );
};
