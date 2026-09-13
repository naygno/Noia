<template>
  <p style="text-align: center; font-weight: bold;">
    {{ supportMessage }}
  </p>

  <p style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
    <button class="image-button" v-on:click="loadUrl('https://github.com/naygno/Noia')">
      <img src="./img/github_logo.svg" height="16" />
      <span>GitHub Oficial do Noia</span>
    </button>
  </p>
</template>

<script setup lang="ts">
import { trans } from 'source/common/i18n-renderer'

const supportMessage = trans('Support the development of Noia')

function loadUrl (url: string) {
  window.location.href = url
}
</script>

<style lang="less">
button {
  &.image-button {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 6px;
    background-color: #21262d;
    color: #c9d1d9;
    border: 1px solid #30363d;
    cursor: pointer;

    &:hover {
      background-color: #30363d;
      color: #ffffff;
    }
  }
}
</style>