/**
 * scene-config.ts — 组态画面 API 门面层
 *
 * 始终走 HTTP 真实 API，无 Mock 回退。
 */
export {
  fetchSceneList,
  fetchSceneDetail,
  fetchSceneOptions,
  createScene,
  updateScene,
  saveSceneLayout,
  saveSceneDraft,
  saveSceneDraftKeepalive,
  toggleSceneStatus,
  removeScene,
  fetchSymbolReferences,
  purgeSymbolReferences,
  importLocalScenes,
} from './adapters/scene-config-http'

export type { SceneFormPayload, SceneImportPayload } from './adapters/scene-config-http'
