<template>
  <div class="animated-gradient">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <!-- Filter for the glow/blur effect -->
      <defs>
        <filter id="blurFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>

      <!-- The animated blob -->
      <path
        id="blob"
        d="M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120"
        filter="url(#blurFilter)"
        opacity="0.85"
        :fill="gradientColor"
      >
        <!-- Slower, larger, more random animation -->
        <animate
          attributeName="d"
          dur="15s"
          repeatCount="indefinite"
          values="
               M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120;
               
               M180,110 C270,60 320,150 270,220 C220,290 130,270 90,200 C50,130 90,160 180,110;
               
               M210,90 C290,85 310,170 260,210 C210,250 140,230 110,170 C80,110 130,95 210,90;
               
               M190,140 C250,70 320,130 290,200 C260,270 150,280 100,220 C50,160 130,210 190,140;
               
               M200,120 C260,80 300,140 280,190 C250,250 170,240 130,190 C90,140 140,160 200,120"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.5 0.1 0.7 0.9; 0.3 0.2 0.5 0.8; 0.4 0 0.6 1"
        />
      </path>
    </svg>
  </div>
</template>

<script setup>

const props = defineProps({
  color: {
    type: String,
    default: 'var(--color-pink)',
  },
  type: {
    type: String,
    default: 'set',
  },
});

const gradientColor = computed(() => {
  switch (props.type) {
    case 'sets':
      return 'var(--color-pink)';
    case 'venue':
      return 'var(--color-blue';
    case 'person':
      return 'var(--color-blue';
    case 'article':
      return 'var(--color-green)';
    default:
      return props.color;
  }
});

</script>

<style lang="postcss" scoped>
.animated-gradient {
  path {
    transition: fill 0.5s ease;
  }
}
</style>