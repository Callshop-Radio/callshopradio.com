<template>
  <div class="svg-container">
    <svg
      viewBox="-30 -30 1113 816"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="stroke-miterlimit: 10"
    >
      <path
        id="path"
        d="M987.783,2L365.557,2C330.413,2 301.909,30.485 301.909,65.629L301.909,189.037C301.909,224.181 273.416,252.666 238.261,252.666L65.648,252.666C30.493,252.666 2,281.151 2,316.295L2,439.703C2,474.847 30.493,503.333 65.648,503.333L110.965,503.333C146.12,503.333 174.613,531.818 174.613,566.962L174.613,690.37C174.613,725.514 203.106,753.999 238.261,753.999L987.783,754C1020.51,754 1047.05,727.475 1047.05,694.754L1047.05,562.591C1047.05,529.871 1020.51,503.345 987.783,503.345L900.423,503.345C872.281,503.345 849.475,480.534 849.475,452.412L849.475,443.566C849.475,408.422 820.982,379.937 785.827,379.937L367.924,379.936C332.77,379.936 304.276,351.451 304.276,316.306C304.276,281.162 332.748,252.654 367.902,252.654C367.902,252.654 987.783,252.655 987.783,252.655C1022.94,252.655 1051.43,224.17 1051.43,189.025L1051.43,65.629C1051.43,30.485 1022.94,2 987.783,2Z"
      />
    </svg>
  </div>
</template>

<style scoped lang="pcss">
.svg-container {
  width: 415px;
  height: auto;
  position: relative;
}

svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

#path {
  stroke: var(--color-pink);
  stroke-width: 3;
  fill: none;
}

#animated-path {
  stroke: var(--color-pink);
  stroke-width: 50;
  stroke-linecap: round;
  fill: none;

  /* Fixed values for truly seamless animation */
  stroke-dasharray: 300px 4415.427734375px;
  animation: worm-move 15s linear infinite;
}

@keyframes worm-move {
  0% {
    stroke-dashoffset: 4715.427734375px;
  }
  100% {
    stroke-dashoffset: 0px;
  }
}
</style>