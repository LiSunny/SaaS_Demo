/**
 * poi.js — POI（兴趣点）注册表
 *
 * ★ 团队只读基线。业务平台通过 manifest.json 消费 POI。
 */

/**
 * @typedef {Object} POI
 * @property {string} id            全局唯一，符合 CAMPUS_<TYPE>_<NN>
 * @property {string} name          名称
 * @property {string} category      类别，见 layout.js POI_CATEGORIES
 * @property {string} type          building | landmark | area | facility
 * @property {number[]} position   世界坐标 [x, y, z]
 * @property {string} [anchor]      entrance | center | ground
 * @property {Object} [bbox]        { min:[x,y,z], max:[x,y,z] }
 * @property {string} [summary]
 * @property {string[]} [tags]
 * @property {Object} [meta]
 */

export function createPOIStore() {
  /** @type {Map<string, POI>} */
  const items = new Map();

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
      return poi;
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
