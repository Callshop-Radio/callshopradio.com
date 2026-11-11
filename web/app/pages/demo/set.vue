<script setup lang="ts">
import { computed, ref } from "vue";

// Demo only: hardcoded snapshot of a real set so the five layouts can be
// compared without touching the production set page.
const localePath = useLocalePath();

const variant = ref(1);
const withTracklist = ref(false);

const variants = [
	{
		id: 1,
		name: "Editorial Split",
		note: "Bild links Â· Info rechts Â· dynamische Rail",
	},
	{ id: 2, name: "Stage Overlay", note: "GroÃŸes Bild Â· Infokarte Ã¼berlappend" },
	{ id: 3, name: "Poster", note: "Zentriert Â· groÃŸe Type Â· Bild darunter" },
	{ id: 4, name: "Index", note: "Kompakter Kopf Â· Tracklist als Hero" },
	{ id: 5, name: "Magazine", note: "GroÃŸe Type links Â· Bild rechts" },
];

const show = { title: "rice & beans", slug: "rice-and-beans" };
const date = "30.10.2026";

type Artist = { title: string; slug: string; linked: boolean; tone: string };

const artists: Artist[] = [
	{ title: "Katarse", slug: "katarse", linked: false, tone: "pink" },
	{ title: "azulado", slug: "azulado", linked: true, tone: "blue" },
];

const tags = ["Ambient", "Folk", "Spoken Word"];

const image =
	"https://cdn.sanity.io/images/0smxd0yv/production/e6211ee4c0a19d08ceca4ad8d9d3bbe101287f7f-1350x1350.png";

const showText =
	"rice and beans is named after gallopinto, a traditional Central American dish you can have for breakfast, lunch, and dinner. Like the dish, this monthly morning radio show is meant to accompany you through the day, offering comfort and connection.";

const episodeText = [
	"Marta, also known as Katarse in the local and international art scene, is a Ukrainian artist known for their large-scale figurative paintings and the skillful intermedia presentations.",
	"â€œI invite you to descend into the true mood of autumn with rice & beans. For the last harvest I prepared a deep and serene dive into the dreamy sounds of oud, Caribbean cello, dark beauty of bulgarian vocalizations, echoes of Caucasus and Ukrainian poetic verses. Smooth and obscure like the icy fog of dawn; like staring into the horizon â€” this is my tribute to Octoberâ€™s grand finale.â€",
];

const poem = [
	"Lord: it is time. The summer was immense.",
	"Lay your shadow on the sundials",
	"and let loose the wind in the fields.",
];

const tracklist = [
	"Unknown â€” Untitled",
	"Ilija Rudman â€” Moving Back",
	"DJ Pipe â€” Puttanesca (feat. hartman & fonte)",
	"BRS â€” Catch The Boat",
	"Alexander East â€” No More (Original Mix)",
	"Flexible â€” Sexdub",
	"Digit Red â€” Shape",
	"Chata â€” Something Between Us",
	"Unreleased (Matt Flores Remix)",
	"Soul Traders â€” Costa Del Soul",
];

const showPath = computed(() => localePath(`/shows/${show.slug}`));
const poolPath = (artist: Artist) => localePath(`/pool/${artist.slug}`);
const tagPath = (tag: string) =>
	localePath({ path: "/search", query: { q: tag, type: "shows" } });
</script>

<template>
	<div class="demo">
		<header class="demo__bar">
			<div class="demo__bar-inner">
				<p class="demo__label">Set-Seite Â· Demo</p>
				<nav class="demo__tabs" aria-label="Varianten">
					<button
						v-for="entry in variants"
						:key="entry.id"
						type="button"
						class="demo__tab"
						:class="{ 'is-active': variant === entry.id }"
						@click="variant = entry.id"
					>
						<span class="demo__tab-index">0{{ entry.id }}</span>
						<span>{{ entry.name }}</span>
					</button>
				</nav>
				<label class="demo__toggle">
					<input v-model="withTracklist" type="checkbox" />
					<span>Tracklist</span>
				</label>
			</div>
			<p class="demo__hint">
				{{ variants.find((entry) => entry.id === variant)?.note }} Â·
				{{ withTracklist ? "mit Tracklist" : "ohne Tracklist" }}
			</p>
		</header>

		<!-- 01 Â· Editorial Split -->
		<section v-if="variant === 1" class="v v1">
			<div class="v1__head">
				<div class="v1__art">
					<img :src="image" alt="Artwork" loading="eager" />
				</div>
				<div class="v1__info">
					<p class="eyebrow">Set <span>Â·</span> {{ date }}</p>
					<NuxtLink class="v1__show" :to="showPath">{{ show.title }}</NuxtLink>
					<p class="v1__line">
						<template v-for="(artist, index) in artists" :key="artist.title">
							<span class="dot" :class="`dot--${artist.tone}`" />
							<NuxtLink
								v-if="artist.linked"
								class="v1__artist"
								:to="poolPath(artist)"
							>
								{{ artist.title }}
							</NuxtLink>
							<span v-else class="v1__artist">{{ artist.title }}</span>
							<span v-if="index < artists.length - 1" class="v1__sep">/</span>
						</template>
					</p>
					<p class="v1__lead">{{ showText }}</p>
					<div class="tags">
						<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
							{{ tag }}
						</NuxtLink>
					</div>
					<div class="actions">
						<button type="button" class="cta">
							<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
							<span>Episode anhÃ¶ren</span>
						</button>
					</div>
				</div>
			</div>

			<div class="body">
				<article class="prose">
					<h2>About this set</h2>
					<p v-for="(paragraph, index) in episodeText" :key="index">
						{{ paragraph }}
					</p>
					<blockquote>
						<p v-for="line in poem" :key="line">{{ line }}</p>
						<cite>Autumn Day Â· R. M. Rilke</cite>
					</blockquote>
				</article>

				<aside class="rail">
					<template v-if="withTracklist">
						<h2 class="rail__title">Tracklist</h2>
						<ol class="tracks">
							<li v-for="(track, index) in tracklist" :key="track">
								<span class="tracks__index">{{ String(index + 1).padStart(2, "0") }}</span>
								<span>{{ track }}</span>
							</li>
						</ol>
					</template>
					<template v-else>
						<h2 class="rail__title">Show &amp; Cast</h2>
						<NuxtLink class="rail__show" :to="showPath">{{ show.title }}</NuxtLink>
						<ul class="cast">
							<li v-for="artist in artists" :key="artist.title">
								<span class="dot" :class="`dot--${artist.tone}`" />
								<NuxtLink v-if="artist.linked" :to="poolPath(artist)">
									{{ artist.title }}
								</NuxtLink>
								<span v-else>{{ artist.title }}</span>
							</li>
						</ul>
						<div class="tags">
							<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
								{{ tag }}
							</NuxtLink>
						</div>
					</template>
				</aside>
			</div>
		</section>

		<!-- 02 Â· Stage Overlay -->
		<section v-if="variant === 2" class="v v2">
			<div class="v2__stage">
				<img :src="image" alt="Artwork" loading="eager" class="v2__image" />
				<div class="v2__shade" />
				<div class="v2__card">
					<p class="eyebrow">Set <span>Â·</span> {{ date }}</p>
					<NuxtLink class="v2__show" :to="showPath">{{ show.title }}</NuxtLink>
					<p class="v2__line">
						<template v-for="(artist, index) in artists" :key="artist.title">
							<span class="dot" :class="`dot--${artist.tone}`" />
							<NuxtLink v-if="artist.linked" :to="poolPath(artist)">
								{{ artist.title }}
							</NuxtLink>
							<span v-else>{{ artist.title }}</span>
							<span v-if="index < artists.length - 1" class="v1__sep">/</span>
						</template>
					</p>
					<div class="tags">
						<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
							{{ tag }}
						</NuxtLink>
					</div>
					<div class="actions">
						<button type="button" class="cta">
							<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
							<span>Episode anhÃ¶ren</span>
						</button>
					</div>
				</div>
			</div>

			<div class="body">
				<article class="prose">
					<h2>About this set</h2>
					<p v-for="(paragraph, index) in episodeText" :key="index">{{ paragraph }}</p>
				</article>
				<aside class="rail">
					<template v-if="withTracklist">
						<h2 class="rail__title">Tracklist</h2>
						<ol class="tracks">
							<li v-for="(track, index) in tracklist" :key="track">
								<span class="tracks__index">{{ String(index + 1).padStart(2, "0") }}</span>
								<span>{{ track }}</span>
							</li>
						</ol>
					</template>
					<template v-else>
						<h2 class="rail__title">Show &amp; Cast</h2>
						<NuxtLink class="rail__show" :to="showPath">{{ show.title }}</NuxtLink>
						<ul class="cast">
							<li v-for="artist in artists" :key="artist.title">
								<span class="dot" :class="`dot--${artist.tone}`" />
								<NuxtLink v-if="artist.linked" :to="poolPath(artist)">
									{{ artist.title }}
								</NuxtLink>
								<span v-else>{{ artist.title }}</span>
							</li>
						</ul>
						<p class="rail__meta">{{ showText }}</p>
					</template>
				</aside>
			</div>
		</section>

		<!-- 03 Â· Poster -->
		<section v-if="variant === 3" class="v v3">
			<div class="v3__head">
				<p class="eyebrow">Set <span>Â·</span> {{ date }}</p>
				<h1 class="v3__title">{{ show.title }}</h1>
				<p class="v3__line">
					<template v-for="(artist, index) in artists" :key="artist.title">
						<span class="dot" :class="`dot--${artist.tone}`" />
						<NuxtLink v-if="artist.linked" :to="poolPath(artist)">{{ artist.title }}</NuxtLink>
						<span v-else>{{ artist.title }}</span>
						<span v-if="index < artists.length - 1" class="v1__sep">/</span>
					</template>
				</p>
				<div class="tags">
					<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
						{{ tag }}
					</NuxtLink>
				</div>
				<div class="actions">
					<button type="button" class="cta">
						<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
						<span>Episode anhÃ¶ren</span>
					</button>
				</div>
			</div>
			<div class="v3__art">
				<img :src="image" alt="Artwork" loading="eager" />
			</div>

			<div class="v3__body">
				<article class="prose prose--center">
					<h2>About this set</h2>
					<p v-for="(paragraph, index) in episodeText" :key="index">{{ paragraph }}</p>
				</article>

				<div v-if="withTracklist" class="v3__tracks">
					<h2 class="rail__title">Tracklist</h2>
					<ol class="tracks tracks--columns">
						<li v-for="(track, index) in tracklist" :key="track">
							<span class="tracks__index">{{ String(index + 1).padStart(2, "0") }}</span>
							<span>{{ track }}</span>
						</li>
					</ol>
				</div>
				<div v-else class="v3__cast">
					<NuxtLink class="rail__show" :to="showPath">{{ show.title }}</NuxtLink>
					<ul class="cast">
						<li v-for="artist in artists" :key="artist.title">
							<span class="dot" :class="`dot--${artist.tone}`" />
							<NuxtLink v-if="artist.linked" :to="poolPath(artist)">{{ artist.title }}</NuxtLink>
							<span v-else>{{ artist.title }}</span>
						</li>
					</ul>
				</div>
			</div>
		</section>

		<!-- 04 Â· Index -->
		<section v-if="variant === 4" class="v v4">
			<div class="v4__head">
				<div class="v4__thumb">
					<img :src="image" alt="Artwork" loading="eager" />
				</div>
				<div class="v4__id">
					<p class="eyebrow">{{ date }} <span>Â·</span> Set</p>
					<NuxtLink class="v4__show" :to="showPath">{{ show.title }}</NuxtLink>
					<p class="v4__line">
						<template v-for="(artist, index) in artists" :key="artist.title">
							<span class="dot" :class="`dot--${artist.tone}`" />
							<NuxtLink v-if="artist.linked" :to="poolPath(artist)">{{ artist.title }}</NuxtLink>
							<span v-else>{{ artist.title }}</span>
							<span v-if="index < artists.length - 1" class="v1__sep">/</span>
						</template>
					</p>
					<div class="tags">
						<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
							{{ tag }}
						</NuxtLink>
					</div>
				</div>
				<button type="button" class="v4__play" aria-label="Episode anhÃ¶ren">
					<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
				</button>
			</div>

			<div class="v4__body">
				<article class="prose v4__about">
					<h2>About this set</h2>
					<p v-for="(paragraph, index) in episodeText" :key="index">{{ paragraph }}</p>
				</article>
				<aside class="rail">
					<template v-if="withTracklist">
						<h2 class="rail__title">Tracklist</h2>
						<ol class="tracks">
							<li v-for="(track, index) in tracklist" :key="track">
								<span class="tracks__index">{{ String(index + 1).padStart(2, "0") }}</span>
								<span>{{ track }}</span>
							</li>
						</ol>
					</template>
					<template v-else>
						<h2 class="rail__title">Show &amp; Cast</h2>
						<NuxtLink class="rail__show" :to="showPath">{{ show.title }}</NuxtLink>
						<ul class="cast">
							<li v-for="artist in artists" :key="artist.title">
								<span class="dot" :class="`dot--${artist.tone}`" />
								<NuxtLink v-if="artist.linked" :to="poolPath(artist)">
									{{ artist.title }}
								</NuxtLink>
								<span v-else>{{ artist.title }}</span>
							</li>
						</ul>
						<p class="rail__meta">{{ showText }}</p>
					</template>
				</aside>
			</div>
		</section>

		<!-- 05 Â· Magazine -->
		<section v-if="variant === 5" class="v v5">
			<div class="v5__head">
				<div class="v5__text">
					<p class="eyebrow">Set <span>Â·</span> {{ date }}</p>
					<h1 class="v5__title">{{ show.title }}</h1>
					<p class="v5__line">
						<template v-for="(artist, index) in artists" :key="artist.title">
							<span class="dot" :class="`dot--${artist.tone}`" />
							<NuxtLink v-if="artist.linked" :to="poolPath(artist)">{{ artist.title }}</NuxtLink>
							<span v-else>{{ artist.title }}</span>
							<span v-if="index < artists.length - 1" class="v1__sep">/</span>
						</template>
					</p>
					<p class="v5__lead">{{ showText }}</p>
					<div class="tags">
						<NuxtLink v-for="tag in tags" :key="tag" class="tag" :to="tagPath(tag)">
							{{ tag }}
						</NuxtLink>
					</div>
					<div class="actions">
						<button type="button" class="cta">
							<img src="/icons/play-button.svg" alt="" aria-hidden="true" />
							<span>Episode anhÃ¶ren</span>
						</button>
					</div>
				</div>
				<div class="v5__art">
					<img :src="image" alt="Artwork" loading="eager" />
				</div>
			</div>

			<div class="v5__body">
				<article class="prose">
					<h2>About this set</h2>
					<p v-for="(paragraph, index) in episodeText" :key="index">{{ paragraph }}</p>
					<blockquote>
						<p v-for="line in poem" :key="line">{{ line }}</p>
						<cite>Autumn Day Â· R. M. Rilke</cite>
					</blockquote>
				</article>
				<div class="v5__trackbox">
					<template v-if="withTracklist">
						<h2 class="rail__title">Tracklist</h2>
						<ol class="tracks tracks--columns">
							<li v-for="(track, index) in tracklist" :key="track">
								<span class="tracks__index">{{ String(index + 1).padStart(2, "0") }}</span>
								<span>{{ track }}</span>
							</li>
						</ol>
					</template>
					<template v-else>
						<h2 class="rail__title">Show &amp; Cast</h2>
						<div class="v5__castrow">
							<NuxtLink class="rail__show" :to="showPath">{{ show.title }}</NuxtLink>
							<ul class="cast">
								<li v-for="artist in artists" :key="artist.title">
									<span class="dot" :class="`dot--${artist.tone}`" />
									<NuxtLink v-if="artist.linked" :to="poolPath(artist)">
										{{ artist.title }}
									</NuxtLink>
									<span v-else>{{ artist.title }}</span>
								</li>
							</ul>
						</div>
					</template>
				</div>
			</div>
		</section>
	</div>
</template>

<style lang="postcss" scoped>
.demo {
  width: var(--page-max-width);
  max-width: 100%;
  margin: 0 auto;
  padding: var(--big-margin) 0 var(--content-gap);

  &__bar {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: var(--mid-padding) 0 var(--small-padding);
    background-color: var(--color-bg);
    border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  }

  &__bar-inner {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--mid-padding);
  }

  &__label {
    font-size: var(--small-font-size);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    opacity: 0.6;
  }

  &__tabs {
    display: flex;
    flex-flow: row wrap;
    gap: 0.375rem;
  }

  &__tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--color-text) 16%, transparent);
    border-radius: var(--pill-radius);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    cursor: pointer;

    &.is-active {
      background-color: var(--color-text);
      border-color: var(--color-text);
      color: var(--color-bg);
    }
  }

  &__tab-index {
    opacity: 0.55;
    font-size: 0.625rem;
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: var(--small-font-size);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    cursor: pointer;
  }

  &__hint {
    margin: 0.4rem 0 0;
    font-size: var(--small-font-size);
    opacity: 0.55;
  }
}

.v {
  margin-top: var(--big-margin);
}

.eyebrow {
  margin: 0;
  font-size: var(--small-font-size);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);

  span {
    opacity: 0.4;
    margin: 0 0.25rem;
  }
}

.dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex: none;

  &--pink {
    background-color: var(--color-pink);
  }
  &--blue {
    background-color: var(--color-blue);
  }
  &--green {
    background-color: var(--color-green);
  }
}

.actions {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: var(--small-padding);
}

/* Shared black pill CTA with the branded play icon. */
.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem 0.45rem 0.45rem;
  border: 0;
  border-radius: var(--pill-radius);
  background-color: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-text);
  font-size: var(--small-font-size);
  text-transform: uppercase;
  letter-spacing: var(--button-letter-spacing);
  cursor: pointer;

  img {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
  }
}

.tags {
  display: flex;
  flex-flow: row wrap;
  gap: 0.375rem;
  align-items: center;

  .tag {
    text-decoration: none;
    line-height: 1.25;
  }
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(18rem, 1fr);
  gap: var(--big-margin);
  align-items: start;
  margin-top: var(--big-margin);

  @media screen and (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: var(--base-margin);
  }
}

.prose {
  max-width: 62ch;

  h2 {
    margin: 0 0 var(--mid-padding);
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
  }

  p {
    margin: 0 0 var(--mid-padding);
    font-size: var(--base-font-size);
    line-height: 1.6;
  }

  blockquote {
    margin: var(--mid-margin) 0 0;
    font-family: var(--font-text-italic);
    font-size: var(--large-font-size);
    line-height: 1.5;
    font-style: normal;

    p {
      margin: 0 0 0.25rem;
    }

    cite {
      display: block;
      margin-top: var(--small-padding);
      font-family: var(--font-text);
      font-size: var(--small-font-size);
      font-style: normal;
      text-transform: uppercase;
      opacity: 0.55;
    }
  }

  &--center {
    margin: 0 auto;
  }
}

.rail {
  position: sticky;
  top: calc(var(--nav-height) + var(--mid-padding));
  display: flex;
  flex-flow: column;
  gap: var(--mid-padding);
  padding-top: 0.25rem;

  @media screen and (max-width: 900px) {
    position: static;
  }

  &__title {
    margin: 0;
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
  }

  &__show {
    font-family: var(--font-text-semibold);
    font-size: var(--large-font-size);
    text-transform: uppercase;
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }

  &__meta {
    margin: 0;
    font-size: var(--base-font-size);
    line-height: 1.55;
    opacity: 0.75;
  }
}

.tracks {
  display: flex;
  flex-flow: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: 2.25rem minmax(0, 1fr);
    gap: 0.5rem;
    padding: 0.6rem 0;
    border-top: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
    font-size: var(--base-font-size);
    line-height: 1.4;

    &:last-child {
      border-bottom: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
    }
  }

  &__index {
    font-size: var(--small-font-size);
    opacity: 0.45;
    font-variant-numeric: tabular-nums;
    padding-top: 0.1rem;
  }

  &--columns {
    columns: 2;
    column-gap: var(--big-margin);

    li {
      break-inside: avoid;
    }

    @media screen and (max-width: 900px) {
      columns: 1;
    }
  }
}

.cast {
  display: flex;
  flex-flow: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--base-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;
  }

  a {
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }
}

/* 01 ---------------------------------------------------------------------- */
.v1 {
  &__head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: var(--big-margin);
    align-items: center;

    @media screen and (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: var(--base-margin);
    }
  }

  &__art {
    border-radius: 5px;
    overflow: hidden;
    background-color: var(--color-grey);

    img {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-flow: column;
    gap: var(--mid-padding);
    align-items: flex-start;
  }

  &__show {
    font-size: clamp(2rem, 4.4vw, 3.6rem);
    line-height: 0.95;
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }

  &__line {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: var(--base-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;
  }

  &__artist {
    color: var(--color-text);
    text-decoration: none;

    &[href]:hover {
      color: var(--color-pink);
    }
  }

  &__sep {
    opacity: 0.35;
  }

  &__lead {
    margin: 0;
    max-width: 46ch;
    font-size: var(--base-font-size);
    line-height: 1.6;
    opacity: 0.85;
  }
}

/* 02 ---------------------------------------------------------------------- */
.v2 {
  &__stage {
    position: relative;
    border-radius: 5px;
    overflow: hidden;
    background: #0a0a0a;
    aspect-ratio: 16 / 9;
    min-height: 26rem;

    @media screen and (max-width: 900px) {
      aspect-ratio: 4 / 5;
      min-height: 0;
    }
  }

  &__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.45) 0%,
      rgba(0, 0, 0, 0.08) 45%,
      rgba(0, 0, 0, 0) 70%
    );
  }

  &__card {
    position: absolute;
    left: var(--mid-margin);
    bottom: var(--mid-margin);
    width: min(30rem, calc(100% - var(--mid-margin) * 2));
    display: flex;
    flex-flow: column;
    gap: var(--small-padding);
    padding: var(--mid-padding) var(--mid-margin) var(--mid-padding) var(--mid-padding);
    border-radius: 5px;
    background: color-mix(in srgb, var(--color-bg) 86%, transparent);
    backdrop-filter: blur(16px);

    @media screen and (max-width: 900px) {
      position: absolute;
      left: var(--small-padding);
      right: var(--small-padding);
      bottom: var(--small-padding);
      width: auto;
      margin-top: 0;
      padding: var(--mid-padding);
    }
  }

  &__show {
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    line-height: 0.95;
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }

  &__line {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: var(--base-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;

    a {
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-pink);
      }
    }
  }
}

/* 03 ---------------------------------------------------------------------- */
.v3 {
  display: flex;
  flex-flow: column;
  align-items: center;

  &__head {
    display: flex;
    flex-flow: column;
    align-items: center;
    gap: var(--small-padding);
    text-align: center;
  }

  &__title {
    margin: 0;
    font-size: clamp(2.6rem, 7vw, 6rem);
    line-height: 0.9;
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    text-align: center;
  }

  &__line {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: var(--base-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;

    a {
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-pink);
      }
    }
  }

  &__art {
    width: min(34rem, 100%);
    margin: var(--base-margin) 0 0;
    border-radius: 5px;
    overflow: hidden;
    background-color: var(--color-grey);

    img {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }
  }

  &__body {
    width: 100%;
    margin-top: var(--big-margin);
    display: flex;
    flex-flow: column;
    gap: var(--base-margin);
  }

  &__tracks {
    max-width: 62rem;
    width: 100%;
    margin: 0 auto;
  }

  &__cast {
    display: flex;
    flex-flow: column;
    align-items: center;
    gap: var(--small-padding);
    text-align: center;
  }
}

/* 04 ---------------------------------------------------------------------- */
.v4 {
  &__head {
    display: grid;
    grid-template-columns: 8rem minmax(0, 1fr) auto;
    gap: var(--mid-margin);
    align-items: center;
    padding-bottom: var(--mid-margin);
    border-bottom: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);

    @media screen and (max-width: 900px) {
      grid-template-columns: 4.5rem minmax(0, 1fr) auto;
      gap: var(--mid-padding);
    }
  }

  &__thumb {
    border-radius: 5px;
    overflow: hidden;
    background-color: var(--color-grey);

    img {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }
  }

  &__id {
    display: flex;
    flex-flow: column;
    gap: 0.35rem;
    min-width: 0;
  }

  &__show {
    font-size: clamp(1.5rem, 3.2vw, 2.4rem);
    line-height: 0.95;
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    color: var(--color-text);
    text-decoration: none;

    &:hover {
      color: var(--color-pink);
    }
  }

  &__line {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: var(--small-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;

    a {
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-pink);
      }
    }
  }

  &__play {
    width: 4rem;
    height: 4rem;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;

    img {
      display: block;
      width: 100%;
      height: 100%;
    }

    @media screen and (max-width: 900px) {
      width: 3rem;
      height: 3rem;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 1fr);
    gap: var(--big-margin);
    align-items: start;
    margin-top: var(--base-margin);

    @media screen and (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &__about {
    max-width: 52ch;
  }
}

/* 05 ---------------------------------------------------------------------- */
.v5 {
  &__head {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: var(--big-margin);
    align-items: start;

    @media screen and (max-width: 900px) {
      grid-template-columns: 1fr;
      gap: var(--base-margin);
    }
  }

  &__text {
    display: flex;
    flex-flow: column;
    gap: var(--mid-padding);
    align-items: flex-start;
  }

  &__title {
    margin: 0;
    font-size: clamp(3rem, 8vw, 6.5rem);
    line-height: 0.86;
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    letter-spacing: -0.01em;
  }

  &__line {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: var(--base-font-size);
    text-transform: uppercase;
    font-family: var(--font-text-semibold);
    font-weight: 500;

    a {
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-pink);
      }
    }
  }

  &__lead {
    margin: 0;
    max-width: 42ch;
    font-size: var(--base-font-size);
    line-height: 1.6;
    opacity: 0.85;
  }

  &__art {
    position: sticky;
    top: calc(var(--nav-height) + var(--mid-padding));
    border-radius: 5px;
    overflow: hidden;
    background-color: var(--color-grey);

    img {
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
    }

    @media screen and (max-width: 900px) {
      position: static;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(16rem, 1fr);
    gap: var(--big-margin);
    align-items: start;
    margin-top: var(--big-margin);

    @media screen and (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  &__trackbox {
    padding-top: var(--small-padding);
  }

  &__castrow {
    display: flex;
    flex-flow: column;
    gap: var(--small-padding);
  }
}
</style>
