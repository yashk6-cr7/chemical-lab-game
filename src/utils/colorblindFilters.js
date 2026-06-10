export const COLORBLIND_FILTERS = {
  none: '',
  deuteranopia: `
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'>
      <filter id='cb-d'>
        <feColorMatrix type='matrix' values='
          0.625 0.375 0 0 0
          0.7   0.3   0 0 0
          0     0.3   0.7 0 0
          0     0     0 1 0'/>
      </filter></svg>#cb-d")
  `,
  protanopia: `
    url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'>
      <filter id='cb-p'>
        <feColorMatrix type='matrix' values='
          0.567 0.433 0 0 0
          0.558 0.442 0 0 0
          0     0.242 0.758 0 0
          0     0     0 1 0'/>
      </filter></svg>#cb-p")
  `,
}
