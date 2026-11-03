/**
 * poi.js — POI（兴趣点）注册表
 *
 * ★ 团队只读基线。业务平台通过 manifest.json 消费 POI。
 * ★ POI 的 id / 名称 / 类别 / 坐标 / 包围盒已由 layout.js 的 POI_LIST 冻结，
 *   本文件只提供「注册 + 网格挂接 + 导出」能力，不新增业务数据。
 */

/**
 * @typedef {Object} POI
 * @property {string} id            全局唯一，PR_<TYPE>_<NN>
 * @property {string} name          名称
 * @property {string} category      类别，见 layout.js PUMP_ROOM.poiCategories
 * @property {string} type          area | facility
 * @property {number[]} position    世界坐标 [x, y, z]
 * @property {string} [anchor]      center | ground | entrance
 * @property {Object} [bbox]        { min:[x,y,z], max:[x,y,z] }
 * @property {string} [summary]
 * @property {string[]} [tags]
 * @property {Object} [meta]
 */

export function createPOIStore() {
  /** @type {Map<string, POI>} */
  const items = new Map();
  /** @type {Map<string, Object[]>} POI id → 已挂接网格 */
  const meshes = new Map();

  const store = {
    /**
     * 注册一个 POI。id 重复时覆盖并输出警告。
     * @param {POI} poi
     * @returns {POI}
     */
    add(poi) {
      if (!poi || !poi.id) {
        console.warn('[poi] 忽略无效 POI：', poi);
        return poi;
      }
      if (items.has(poi.id)) {
        console.warn(`[poi] POI id 重复，已覆盖：${poi.id}`);
      }
      items.set(poi.id, poi);
      if (!meshes.has(poi.id)) meshes.set(poi.id, []);
      return poi;
    },

    /**
     * 批量注册 POI（通常直接传入 layout.js 的 POI_LIST）。
     * @param {POI[]} list
     */
    addAll(list) {
      if (!Array.isArray(list)) return store;
      for (const poi of list) store.add(poi);
      return store;
    },

    /**
     * 把网格挂接到某个 POI，供射线拾取精确命中。
     * 网格需带 userData.poiId 或能被归属推断。
     * @param {string} poiId
     * @param {Object} mesh THREE.Object3D
     */
    register(poiId, mesh) {
      if (!poiId || !mesh) return;
      if (!meshes.has(poiId)) meshes.set(poiId, []);
      const list = meshes.get(poiId);
      if (!list.includes(mesh)) list.push(mesh);
      if (mesh.userData && !mesh.userData.poiId) mesh.userData.poiId = poiId;
    },

    /**
     * 取得某 POI 挂接的全部网格。
     * @param {string} poiId
     * @returns {Object[]}
     */
    meshesOf(poiId) {
      return meshes.get(poiId) || [];
    },

    /** 已挂接网格总数 */
    meshCount() {
      let n = 0;
      for (const list of meshes.values()) n += list.length;
      return n;
    },

    /** @param {string} id */
    get(id) {
      return items.get(id);
    },

    /** @returns {POI[]} */
    list() {
      return Array.from(items.values());
    },

    /** @param {string} category */
    byCategory(category) {
      return store.list().filter((p) => p.category === category);
    },

    /** @param {string} type */
    byType(type) {
      return store.list().filter((p) => p.type === type);
    },

    /** @returns {number} */
    size() {
      return items.size;
    },

    clear() {
      items.clear();
      meshes.clear();
    },

    /**
     * 导出为业务平台可消费的清单结构。
     * @returns {{version:string, generatedAt:string|null, items:POI[]}}
     */
    toJSON() {
      return {
        version: '1.0',
        generatedAt: null,
        items: store.list(),
      };
    },
  };

  return store;
}

export default createPOIStore;
