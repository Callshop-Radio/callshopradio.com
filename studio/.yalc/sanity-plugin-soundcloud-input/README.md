# sanity-plugin-soundcloud-input

> This is a **Sanity Studio v3** plugin.

## Installation

```sh
npm install sanity-plugin-soundcloud-input
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {soundcloudInput} from 'sanity-plugin-soundcloud-input'

export default defineConfig({
  //...
  plugins: [soundcloudInput({})],
})
```

## License

[MIT](LICENSE) © Damian Rosellen

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.
