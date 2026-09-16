<template>
  <div id="splash">
    <div>
      <div class="splash-frame-wrapper">
        <img src="./images/splash_frame_1.png" />
        <img class="splash-frame splash-frame-image" src="./images/splash_image.png" />
        <img class="splash-frame" src="./images/splash_frame_2.png" />
      </div>
      <h2>Sigue al pato amarillo</h2>
      <template v-if="error">
        <p role="alert">No se pudieron cargar los recursos del hotel.</p>
        <button type="button" @click="loadAssets">Reintentar</button>
      </template>
      <template v-else>
        <oh-progress :value="progress" />
        <h4>{{ progress.toFixed(0) }}%</h4>
      </template>
    </div>
  </div>
</template>

<script>
import { Loader } from '../../../engine/loader'

export default {
  name: 'HotelSplash',
  data() {
    return {
      progress: 0,
      loading: false,
      error: false,
    }
  },
  methods: {
    async loadAssets() {
      if (this.loading) return
      this.loading = true
      this.error = false
      try {
        const loader = await this.$injets.get(Loader)
        await loader
          .add({
            figuremap: 'figuremap.json',
            figuredata: 'figuredata.json',
            partsets: 'HabboAvatarPartSets.json',
            avatarActions: 'HabboAvatarActions.json',
            geometry: 'HabboAvatarGeometry.json',
            animations: 'HabboAvatarAnimations.json',
            effectmap: 'effectmap.json',
          })
          .progress((loaded, total) => {
            this.progress = (loaded / total) * 100
          })
          .wait()
        this.$emit('splash-ready', loader)
        this.$router.replace({ name: 'game' })
      } catch {
        this.error = true
      } finally {
        this.loading = false
      }
    },
  },
  created() {
    this.loadAssets()
  },
}
</script>

<style lang="stylus">
#splash {
  width: 100%;
  height: 100%;
  background: #070a0e;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(#FFF, 0.9);
  padding-bottom: 27px;

  h2 {
    margin: 16px 0;
  }

  h4 {
    margin: 8px;
  }

  p {
    margin: 16px;
  }

  button {
    border: 2px solid #FFF;
    border-radius: 6px;
    padding: 8px 16px;
    background: #3A7392;
    color: #FFF;
    font: inherit;
    font-weight: bold;
    cursor: pointer;
  }

  .splash-frame {
    position: absolute;
    top: 0;
    left: 0;

    &-wrapper {
      position: relative;
    }

    &-image {
      top: 51px;
      left: 95px;
    }
  }
}
</style>