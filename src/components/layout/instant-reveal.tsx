export const INSTANT_REVEAL =
  'Object.defineProperty(window,"$RT",{configurable:true,get:function(){},set:function(){}})'

export const InstantReveal = () => <script>{INSTANT_REVEAL}</script>
