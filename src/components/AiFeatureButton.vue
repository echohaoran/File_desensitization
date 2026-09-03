<template>
  <span
    class="ai-feature-gate"
    :class="{ 'ai-feature-gate--block': block, 'is-blocked': !availability.available }"
    :tabindex="availability.available ? null : 0"
    :data-ai-state="availability.state"
    :aria-label="availability.message || null"
    @mouseenter="refreshAvailability"
  >
    <button
      v-bind="$attrs"
      :class="buttonClass"
      :disabled="isDisabled"
      @click="handleClick"
    ><slot /></button>
    <span v-if="!availability.available" class="ai-feature-gate__tooltip" role="tooltip">{{ availability.message }}</span>
  </span>
</template>

<script>
import { AI_AVAILABILITY_EVENT, readAiAvailability } from '@/utils/aiAvailability'

export default {
  name: 'AiFeatureButton',
  inheritAttrs: false,
  props: {
    buttonClass: { type: [String, Array, Object], default: '' },
    disabled: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    requireDesktop: { type: Boolean, default: true }
  },
  emits: ['click'],
  data() {
    return { availability: readAiAvailability({ requireDesktop: this.requireDesktop }) }
  },
  computed: {
    isDisabled() { return this.disabled || !this.availability.available }
  },
  mounted() {
    this.availabilityListener = () => this.refreshAvailability()
    window.addEventListener(AI_AVAILABILITY_EVENT, this.availabilityListener)
    window.addEventListener('storage', this.availabilityListener)
    window.addEventListener('focus', this.availabilityListener)
  },
  beforeUnmount() {
    window.removeEventListener(AI_AVAILABILITY_EVENT, this.availabilityListener)
    window.removeEventListener('storage', this.availabilityListener)
    window.removeEventListener('focus', this.availabilityListener)
  },
  methods: {
    refreshAvailability() {
      this.availability = readAiAvailability({ requireDesktop: this.requireDesktop })
    },
    handleClick(event) {
      if (!this.isDisabled) this.$emit('click', event)
    }
  }
}
</script>

<style scoped>
.ai-feature-gate { position: relative; display: inline-flex; }
.ai-feature-gate--block { display: flex; width: 100%; }
.ai-feature-gate--block > button { width: 100%; }
.ai-feature-gate.is-blocked > button { pointer-events: none; cursor: not-allowed; opacity: .48; filter: grayscale(1); box-shadow: none; }
.ai-feature-gate__tooltip { position: absolute; z-index: 120; left: 50%; bottom: calc(100% + 9px); width: max-content; max-width: min(280px, 80vw); padding: 8px 10px; border-radius: 8px; background: #111827; color: #fff; font-size: 12px; font-weight: 500; line-height: 1.45; text-align: center; pointer-events: none; opacity: 0; transform: translate(-50%, 4px); transition: opacity .14s ease, transform .14s ease; box-shadow: 0 8px 24px rgba(15, 23, 42, .2); }
.ai-feature-gate__tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; border: 5px solid transparent; border-top-color: #111827; transform: translateX(-50%); }
.ai-feature-gate.is-blocked:hover .ai-feature-gate__tooltip,
.ai-feature-gate.is-blocked:focus .ai-feature-gate__tooltip,
.ai-feature-gate.is-blocked:focus-within .ai-feature-gate__tooltip { opacity: 1; transform: translate(-50%, 0); }
</style>
