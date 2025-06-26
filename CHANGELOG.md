# Changelog

## <small>0.4.3 (2025-06-26)</small>

* chore: format sql files with prettier ([a4c545e](https://github.com/gabrielecanepa/glore/commit/a4c545e))
* chore: group scoped components in a single `features` folder ([082a1b9](https://github.com/gabrielecanepa/glore/commit/082a1b9))
* chore(dev): set up seeds ([914ddd6](https://github.com/gabrielecanepa/glore/commit/914ddd6))
* ci: add pnpm scripts to manage the database ([308879f](https://github.com/gabrielecanepa/glore/commit/308879f))

## <small>0.4.2 (2025-06-24)</small>

* chore: improve layout ([3b2bef6](https://github.com/gabrielecanepa/glore/commit/3b2bef6))
* chore: improve sidebar style ([f13894d](https://github.com/gabrielecanepa/glore/commit/f13894d))
* chore: prepare release ([70093ea](https://github.com/gabrielecanepa/glore/commit/70093ea))
* chore: refactor course components ([74de17f](https://github.com/gabrielecanepa/glore/commit/74de17f))
* chore: update certificates tables; fetch certificates in main user request ([733c2c2](https://github.com/gabrielecanepa/glore/commit/733c2c2))
* chore: use react-scan in development to optimize components ([6da61f9](https://github.com/gabrielecanepa/glore/commit/6da61f9))
* chore(dev): add local Supabase environment ([e1b4263](https://github.com/gabrielecanepa/glore/commit/e1b4263))
* chore(dev): refactor, rename and add internal utilities ([1d013ac](https://github.com/gabrielecanepa/glore/commit/1d013ac))
* ci: add analyze command ([5ca8fa0](https://github.com/gabrielecanepa/glore/commit/5ca8fa0))
* ci: fix typegen in ci environments ([24d84db](https://github.com/gabrielecanepa/glore/commit/24d84db))
* ci: run remote migrations on successful code check ([97f6e3b](https://github.com/gabrielecanepa/glore/commit/97f6e3b))
* ci: update action workflows ([fe7e9ac](https://github.com/gabrielecanepa/glore/commit/fe7e9ac))
* ci: update release-it config ([1b853be](https://github.com/gabrielecanepa/glore/commit/1b853be))
* build: ignore all build dependencies except supabase ([216af0f](https://github.com/gabrielecanepa/glore/commit/216af0f))
* build(deps): bump dependencies ([ebfbb6c](https://github.com/gabrielecanepa/glore/commit/ebfbb6c))
* build(deps): bump packages ([7a96cf3](https://github.com/gabrielecanepa/glore/commit/7a96cf3))
* build(deps): update lockfile to latest versions ([7f136bf](https://github.com/gabrielecanepa/glore/commit/7f136bf))
* docs: update README ([2ecae4c](https://github.com/gabrielecanepa/glore/commit/2ecae4c))
* chore!: update database schema and refactor codebase ([aa7e31a](https://github.com/gabrielecanepa/glore/commit/aa7e31a))
* refactor: improve modules list sorting logic ([812a2a7](https://github.com/gabrielecanepa/glore/commit/812a2a7))

## [0.4.1](https://github.com/gabrielecanepa/glore/compare/v0.4.0...v0.4.1) (2025-04-17)


### 🚀 Features

* improve modules list ([819fc46](https://github.com/gabrielecanepa/glore/commit/819fc46836d7f0516a2dc552568f82109e24db7d))


### ⚙️ CI

* **release-it-config:** add `afterInit`, `afterBump` and `afterRelease`  options ([b5574a1](https://github.com/gabrielecanepa/glore/commit/b5574a1e7cf9b44d9e5532813c94f4ed80f05e1e))

## [0.4.0](https://github.com/gabrielecanepa/glore/compare/v0.3.10...v0.4.0) (2025-04-16)


### 🔧 Fixes

* fix module flow steps ([23f70fc](https://github.com/gabrielecanepa/glore/commit/23f70fc5a308e67be3a62e0b0f4dd34d0b4143ff))


### ⚙️ CI

* don't generate automatic notes in github releases ([9c41bac](https://github.com/gabrielecanepa/glore/commit/9c41baca51509dc0d231bb09611736a2739feaff))


### Other

* remove unused crowdin config ([47af8cd](https://github.com/gabrielecanepa/glore/commit/47af8cd6c15f9f901700ea5942130196c11bbab4))

## [0.3.10](https://github.com/gabrielecanepa/glore/compare/v0.3.9...v0.3.10) (2025-04-15)


### 🚀 Features

* complete module flow ([605bf32](https://github.com/gabrielecanepa/glore/commit/605bf320f7bc80dbc8e2d2745180e91ff7a21ca8))


### 🏗️ Build

* downgrade next to 15.2.5 for compatibility with million ([1c2c8e3](https://github.com/gabrielecanepa/glore/commit/1c2c8e3708f5e363b3f0a6de45a8733d7d994c15))


### ⚙️ CI

* don't watch for deployment workflow runs ([60c30ee](https://github.com/gabrielecanepa/glore/commit/60c30ee2790b73273a6317b7e84176f6f48dcfb4))
* fix commitlint check on pull request ([0e349cd](https://github.com/gabrielecanepa/glore/commit/0e349cdf5ecadb8ddaa917930c8b9017271b306c))
* fix release command ([999f22a](https://github.com/gabrielecanepa/glore/commit/999f22aa5e07cebc3270bce629f733af71539c9d))


### Other

* update static translations ([dddc213](https://github.com/gabrielecanepa/glore/commit/dddc2137e36243f29ac8c03156574e5a3477209e))

## [0.3.9](https://github.com/gabrielecanepa/glore/compare/v0.3.8...v0.3.9) (2025-04-13)


### 🏗️ Build

* bump packages ([5964cdb](https://github.com/gabrielecanepa/glore/commit/5964cdbd21de98c12a4ed2c974afa3bebbb6137e))


### ⚙️ CI

* add changelog and release notes generation ([9056857](https://github.com/gabrielecanepa/glore/commit/90568575762f9ad52e7d48b2d662d5d2165f7cd5))
* use `pnpm deploy` to deploy elearning ([48f349a](https://github.com/gabrielecanepa/glore/commit/48f349adbee4eba5aa0af85db06ceb141059ec59))


### 📑 Docs

* add version badge to readme ([0167e35](https://github.com/gabrielecanepa/glore/commit/0167e35628c9eaa453837c9e0efdaa893ad7590c))
