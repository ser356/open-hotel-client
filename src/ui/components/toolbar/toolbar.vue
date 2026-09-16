<template>
  <div class="oh-toolbar">
    <div class="oh-toolbar-area">
      <button class="oh-toolbar-button btn-navigator" aria-label="Abrir navegador de salas" @click="$emit('toggle-window', 'browser')">
        <img src="./toolbar_button_navigator.png" alt="" />
      </button>
    </div>
  </div>
</template>
<style lang="stylus">
.oh-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2e2e2c;
  padding-top: 1px;

  &-area {
    border-top: 2px solid #53524f;
    border-bottom: 1px solid #53524f;
    height: 49px;
    display: flex;
    padding: 3px 4px 4px 4px;
    padding-left: 14px;
    padding-right: 14px;
  }

  &-button {
    display: block;
    background: none;
    border: none;
    background-repeat: no-repeat;
    background-size: auto;
    background-position: center;
    cursor: pointer;
    margin: 0 16px 0 0;
    outline: none;

    &:hover {
      filter: drop-shadow(1px 2px 0 rgba(0, 0, 0, 0.75));
      transform: translate(0, -2px);
    }
  }

  .btn-navigator {
    margin-top: 1px;
    margin-left: 1px;
  }
}
</style>