<template>
  <div class="flex flex-1 browser">
    <px-tab-container style="padding: 0.5em;">
      <oh-all-rooms />
    </px-tab-container>
  </div>
</template>

<script>
import OhAllRooms from './all-rooms.vue'

export default {
  components: { OhAllRooms },
}
</script>

<style lang="stylus" scoped>
.browser {
  flex-flow: column
}
</style>
