<template>
  <h1>{{ pageHeading }}</h1>

  <p>
    {{ previewInfo }}
  </p>

  <p>
    <button v-bind:class="{ active: hasActivatedPreviws }" v-on:click="togglePreviews">
      {{ activateLabel }}
    </button>
  </p>
</template>

<script setup lang="ts">
import { trans } from 'source/common/i18n-renderer'
import { useConfigStore } from 'source/pinia'
import { computed } from 'vue'

const configStore = useConfigStore()

const pageHeading = trans('Images and PDFs in Noia')
const previewInfo = trans('Noia can preview images and PDF files directly in Noia. This allows you to reference plots or literature directly while writing. If you do not activate this, images and PDF files will only be shown in the sidebar and open with your computer\'s default viewer.')
const activateLabel = trans('Activate Image and PDF Previews in Noia')

const hasActivatedPreviws = computed(() => {
  return configStore.config.files.images.showInFilemanager &&
  configStore.config.files.pdf.showInFilemanager
})

function togglePreviews () {
  if (hasActivatedPreviws.value) {
    configStore.setConfigValue('files.images', { showInFilemanager: false, showInSidebar: true, openWith: 'system' })
    configStore.setConfigValue('files.pdf', { showInFilemanager: false, showInSidebar: true, openWith: 'system' })
  } else {
    configStore.setConfigValue('files.images', { showInFilemanager: true, showInSidebar: false, openWith: 'Noia' })
    configStore.setConfigValue('files.pdf', { showInFilemanager: true, showInSidebar: false, openWith: 'Noia' })
  }
}
</script>

<style lang="css" scoped>
</style>
