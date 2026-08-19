export function getPlatform(): string {
  // #ifdef H5
  return 'h5'
  // #endif
  // #ifdef MP-WEIXIN
  return 'mp-weixin'
  // #endif
  // #ifdef MP-ALIPAY
  return 'mp-alipay'
  // #endif
  // #ifdef APP-PLUS
  return 'app-plus'
  // #endif
  return 'unknown'
}

export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  return false
}

export function isMpWeixin(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  return false
}
