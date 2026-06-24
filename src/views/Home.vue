<template>
  <div class="container index-main">
    <div class="index-eyebrow">
      <span class="index-eyebrow__line" aria-hidden="true"></span>
      <span class="mono-label">PRODUCT / v0.1 PROTOTYPE</span>
    </div>

    <section class="index-hero">
      <h1>多步骤脱敏系统</h1>
      <p>
        面向企业内部投资人员与私募基金管理员的本地优先型敏感数据脱敏工具。上传文件后系统自动识别敏感信息，
        人工复核后生成<strong>脱敏文件</strong>与<strong>字段映射表</strong>；凭借映射表可完整还原原始文件。
        每个浏览器持有独立用户标识，数据互不交叉。
      </p>
    </section>

    <section class="cards-grid" aria-label="工作流导航">
      <router-link class="nav-card" to="/desensitize" aria-label="进入脱敏工作流">
        <div class="nav-card__head">
          <span class="nav-card__num">01</span>
          <span class="nav-card__tag">DESENSITIZE</span>
        </div>
        <h2>脱敏工作流</h2>
        <p>上传文本或图片文件，系统自动检测敏感字段并在右侧预览，人工增删脱敏区域后生成脱敏文件与映射表。</p>
        <ul class="nav-card__features">
          <li>文本 / CSV / JSON 正则检测</li>
          <li>图片 Canvas 框选遮盖</li>
          <li>映射表本地持久化</li>
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
        <p>上传此前生成的脱敏文件与对应映射表 JSON，校验用户归属后按映射关系还原原始文件并下载。</p>
        <ul class="nav-card__features">
          <li>映射表用户归属校验</li>
          <li>占位符逆向替换</li>
          <li>图片原图重建</li>
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
        <strong>用户数据隔离：</strong>当前浏览器已分配独立用户标识（见页头 USER 标签）。
        所有映射表均以该标识为键存入 localStorage，不同浏览器 / 用户之间互不可见。生产环境将改由后端按 <code>uploads/{user_id}/</code> 目录树与数据库 <code>user_id</code> 外键强制隔离。
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
