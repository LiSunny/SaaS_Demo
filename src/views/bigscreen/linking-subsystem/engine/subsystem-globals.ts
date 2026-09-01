// 各引擎内联 onclick 所需的全局函数注册表（原 index.html 顶层全局函数 1:1）
// 每个引擎导出 mount/unmount，SubsystemView 在渲染后调用并随卸载清理

export interface GlobalFnRegister {
  /** 需要挂到 window 的函数名（引擎模块对象里的导出名） */
  fns: string[]
  /** 非导出但挂全局的名称 → 引擎内函数名 */
  aliases?: Record<string, string>
}

export function mountEngineGlobals(engine: any, register: GlobalFnRegister) {
  const w = window as any
  ;[...register.fns, ...(Object.keys(register.aliases || {}))].forEach(name => {
    const fn = engine[name] || engine[register.aliases?.[name as string] || name]
    if (typeof fn === 'function') w[name] = fn
  })
}

export function unmountEngineGlobals(register: GlobalFnRegister) {
  const w = window as any
  ;[...register.fns, ...(Object.keys(register.aliases || {}))].forEach(name => {
    delete w[name]
  })
}

/** 各模块的全局注册表 + 挂载辅助函数 */
export const REGISTERS: Record<string, GlobalFnRegister> = {
  overview: {
    fns: ['selectShop', 'selectStreet', 'ovToggleTypeShow', 'ovToggleStreetShow', 'ovToggleDutyShow', 'showResponsibility'],
  },
  events: {
    fns: ['evSwitchTab', 'evSetStatusFilter', 'evSetSearch', 'evSetPage', 'evApplyMetricFilter', 'showEventDetail', 'evFilterShop'],
  },
  hazards: {
    fns: ['hzSetStatusFilter', 'hzSetLevelFilter', 'hzSetSearch', 'hzSetPage', 'hzFilterShop', 'showEventDetail'],
  },
  controlRooms: {
    fns: ['crSetFilter', 'crSetSearch', 'crSetPage', 'showCamVideo', 'showControlRoomDetail', 'showLeaveShot', 'showLeaveDetail'],
  },
  hotWork: {
    fns: ['hwSetFilter', 'hwSetLevelFilter', 'hwSetSearch', 'hwSetPage', 'hwSelectStep', 'showHotWorkDetail'],
  },
  emergency: {
    fns: ['emSetFilter', 'emSetLevelFilter', 'emSetSearch', 'emSetPage', 'showEmergencyDetail'],
  },
  jointDuty: {
    fns: ['jdSetFilter', 'jdSetSearch', 'jdSetPage', 'openNoticeDialog', 'setNfScope', 'regenerateNoticeCode', 'addNoticeBlock', 'publishNotice', 'showNoticeDetail'],
  },
  devices: {
    fns: ['dvSetFilter', 'dvSetStatusFilter', 'dvSetTypeFilter', 'dvSelectTypeFilter', 'dvSetSearch', 'dvSetPage', 'showDeviceDetail', 'ddTab', 'showDeviceHistory', 'showEventDetail'],
  },
  shops: {
    fns: ['shSetMetricFilter', 'shSetTypeFilter', 'shSetStatusFilter', 'shSetSearch', 'shSetPage', 'showShopDetail', 'showQRCode'],
  },
  ledger: {
    fns: ['lgSetTypeFilter', 'lgSetStatusFilter', 'lgSetSearch', 'lgSetPage', 'showDeviceDetail'],
  },
}
