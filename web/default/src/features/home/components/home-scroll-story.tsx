/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { HomeStoryMedia, type HomeStoryScene } from './home-story-media'

type Story = {
  scene: HomeStoryScene
  label: string
  title: string
  titleLines: [string, string]
  body: string
  inputRange: number[]
  opacityRange: number[]
  yRange: number[]
  mediaInputRange: number[]
  mediaScaleRange: number[]
  mediaYRange: number[]
}

const STORIES: Story[] = [
  {
    scene: 'overview',
    label: '01 · OVERVIEW',
    title: 'The whole service, understood at a glance.',
    titleLines: ['The whole service,', 'understood at a glance.'],
    body: 'Balance, request volume, model health, and uptime stay together in one operational view.',
    inputRange: [0, 0.26, 0.38, 1],
    opacityRange: [1, 1, 0, 0],
    yRange: [0, 0, -20, -20],
    mediaInputRange: [0, 0.16, 0.3, 1],
    mediaScaleRange: [0.98, 1, 1.015, 1.015],
    mediaYRange: [16, 0, -6, -6],
  },
  {
    scene: 'keys',
    label: '02 · CONTROL',
    title: 'A key with exactly the access it needs.',
    titleLines: ['A key with', 'exactly the access it needs.'],
    body: 'Limit models, quota, expiry, and source IP without changing the client workflow.',
    inputRange: [0, 0.28, 0.4, 0.6, 0.72, 1],
    opacityRange: [0, 0, 1, 1, 0, 0],
    yRange: [24, 24, 0, 0, -20, -20],
    mediaInputRange: [0, 0.28, 0.4, 0.6, 0.72, 1],
    mediaScaleRange: [1.02, 1.02, 1, 1.015, 1.025, 1.025],
    mediaYRange: [12, 12, 0, -6, -10, -10],
  },
  {
    scene: 'logs',
    label: '03 · OBSERVE',
    title: 'Every request stays understandable.',
    titleLines: ['Every request', 'stays understandable.'],
    body: 'Inspect tokens, latency, cost, status, and Request ID without storing prompt or response bodies.',
    inputRange: [0, 0.62, 0.74, 1],
    opacityRange: [0, 0, 1, 1],
    yRange: [24, 24, 0, 0],
    mediaInputRange: [0, 0.62, 0.74, 1],
    mediaScaleRange: [1.02, 1.02, 1, 1.015],
    mediaYRange: [12, 12, 0, -6],
  },
]

function AnimatedStoryCopy(props: {
  story: Story
  progress: MotionValue<number>
}) {
  const { t } = useTranslation()
  const opacity = useTransform(
    props.progress,
    props.story.inputRange,
    props.story.opacityRange
  )
  const y = useTransform(
    props.progress,
    props.story.inputRange,
    props.story.yRange
  )

  return (
    <motion.div className='iterloop-story-copy' style={{ opacity, y }}>
      <span>{t(props.story.label)}</span>
      <h2 aria-label={t(props.story.title)}>
        {props.story.titleLines.map((line) => (
          <span key={line}>{t(line)}</span>
        ))}
      </h2>
      <p>{t(props.story.body)}</p>
    </motion.div>
  )
}

function AnimatedStoryMedia(props: {
  story: Story
  progress: MotionValue<number>
  priority?: boolean
}) {
  const opacity = useTransform(
    props.progress,
    props.story.inputRange,
    props.story.opacityRange
  )
  const scale = useTransform(
    props.progress,
    props.story.mediaInputRange,
    props.story.mediaScaleRange
  )
  const y = useTransform(
    props.progress,
    props.story.mediaInputRange,
    props.story.mediaYRange
  )

  return (
    <motion.div
      className='iterloop-story-media-layer'
      style={{ opacity, scale, y }}
    >
      <HomeStoryMedia scene={props.story.scene} priority={props.priority} />
    </motion.div>
  )
}

function StaticStories() {
  const { t } = useTranslation()
  return (
    <div className='iterloop-story-static'>
      {STORIES.map((story, index) => (
        <article key={story.scene}>
          <div>
            <span>{t(story.label)}</span>
            <h2 aria-label={t(story.title)}>
              {story.titleLines.map((line) => (
                <span key={line}>{t(line)}</span>
              ))}
            </h2>
            <p>{t(story.body)}</p>
          </div>
          <HomeStoryMedia scene={story.scene} priority={index === 0} />
        </article>
      ))}
    </div>
  )
}

export function HomeScrollStory() {
  const targetRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  })
  const frameScale = useTransform(
    scrollYProgress,
    [0, 0.14, 0.88, 1],
    [0.92, 1, 1, 0.96]
  )
  const frameY = useTransform(
    scrollYProgress,
    [0, 0.14, 0.88, 1],
    [38, 0, 0, -22]
  )
  const frameRadius = useTransform(scrollYProgress, [0, 0.16], [24, 18])
  const firstProgress = useTransform(scrollYProgress, [0, 0.32], [0, 1])
  const secondProgress = useTransform(
    scrollYProgress,
    [0, 0.32, 0.66, 1],
    [0, 0, 1, 1]
  )
  const thirdProgress = useTransform(scrollYProgress, [0, 0.66, 1], [0, 0, 1])

  if (reduceMotion) {
    return (
      <section className='iterloop-scroll-story is-reduced'>
        <StaticStories />
      </section>
    )
  }

  return (
    <section ref={targetRef} className='iterloop-scroll-story'>
      <div className='iterloop-story-mobile'>
        <StaticStories />
      </div>
      <div className='iterloop-story-sticky'>
        <div className='iterloop-story-copy-stack'>
          {STORIES.map((story) => (
            <AnimatedStoryCopy
              key={story.scene}
              story={story}
              progress={scrollYProgress}
            />
          ))}
        </div>
        <motion.div
          className='iterloop-story-frame'
          style={{ scale: frameScale, y: frameY, borderRadius: frameRadius }}
        >
          {STORIES.map((story, index) => (
            <AnimatedStoryMedia
              key={story.scene}
              story={story}
              progress={scrollYProgress}
              priority={index === 0}
            />
          ))}
        </motion.div>
        <div className='iterloop-story-progress' aria-hidden='true'>
          <i>
            <motion.span style={{ scaleX: firstProgress }} />
          </i>
          <i>
            <motion.span style={{ scaleX: secondProgress }} />
          </i>
          <i>
            <motion.span style={{ scaleX: thirdProgress }} />
          </i>
        </div>
      </div>
    </section>
  )
}
