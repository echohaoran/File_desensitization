<template>
  <div class="container index-main">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">PRODUCT / v0.1 PROTOTYPE</span>
    </div>

    <section class="index-hero">
      <h1>文件脱敏与还原工具</h1>
      <p>
        用于识别、复核和替换文件中的敏感信息。上传文件后，系统会给出检测结果；可手动添加或取消脱敏项，确认后生成<strong>脱敏结果</strong>与<strong>映射表</strong>。
        还原页面支持选择本机历史记录或映射表执行还原。<strong>该应用纯本地运行</strong>。
      </p>
    </section>

    <section class="cards-grid" aria-label="工作流导航">
      <router-link class="nav-card" to="/desensitize" aria-label="进入脱敏工作流">
        <div class="nav-card__head">
          <span class="nav-card__num">01</span>
          <span class="nav-card__tag">DESENSITIZE</span>
        </div>
        <h2>脱敏工作流</h2>
        <p>上传受支持的文件，查看检测结果；人工确认后生成脱敏结果与映射表。</p>
        <ul class="nav-card__features">
          <li>常用敏感字段检测</li>
          <li>人工添加或取消脱敏项</li>
          <li>本机保存脱敏历史</li>
        </ul>
        <span class="btn btn--primary btn--block">
          进入工作流
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </router-link>

      <router-link class="nav-card" to="/restore" aria-label="进入还原工作流">
        <div class="nav-card__head">
          <span class="nav-card__num">02</span>
          <span class="nav-card__tag">RESTORE</span>
        </div>
        <h2>还原工作流</h2>
        <p>选择本机脱敏历史，或上传脱敏文件与对应映射表，按映射关系还原内容。</p>
        <ul class="nav-card__features">
          <li>本机映射表直接还原</li>
          <li>占位符逆向替换</li>
          <li>映射记录管理</li>
        </ul>
        <span class="btn btn--secondary btn--block">
          进入工作流
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </span>
      </router-link>
    </section>

    <div class="index-strip">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <p>
        <strong>使用说明：</strong>无需登录。使用“敏感字段”维护规则；规则与脱敏历史保存在当前浏览器。处理前请确认服务部署位置符合你的数据安全要求。
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
