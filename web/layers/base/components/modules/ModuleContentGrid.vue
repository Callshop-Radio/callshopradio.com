<script setup lang="ts">
const props = defineProps({
  gridContent: {
    type: Object,
    default: () => [],
  },
});
</script>

<template>
  <div class="module content__grid">
    <!-- Pool -->
    <div v-if="gridContent.type == 'pool'" class="grid-container pool">
      <div
        v-for="item in gridContent.items"
        :key="item._key"
        class="grid-container__content__grid-item"
      >
        <div class="grid-container__content__grid-item__box">
          <MediaImage :image="item.image" />
          <article>
            <h4>{{ formatDate(item.date) }}</h4>
            <h3>{{ item.title }}</h3>
            <!-- <p>{{ item.description }}</p> -->
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.module-content-grid {
  @apply mb-6;

  .grid-container {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
  }

  .grid-item {
    @apply bg-white shadow-md rounded-lg p-4 flex flex-col items-center justify-center;
    transition: transform 0.2s;

    &:hover {
      @apply transform scale-105;
    }

    img {
      @apply max-w-full h-auto rounded-md;
    }

    .content-box {
      @apply text-center;
    }

    h3 {
      @apply text-lg font-bold mb-2;
    }

    p {
      @apply text-gray-700;
    }
  }
}
</style>
