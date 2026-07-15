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
  body: string
  inputRange: number[]
  opacityRange: number[]
  yRange: number[]
}

const STORIES: Story[] = [
  {
    scene: 'overview',
    label: '01 · OVERVIEW',
    title: 'The whole service, understood at a glance.',
    body: 'Balance, request volume, model health, and uptime stay together in one operational view.',
    inputRange: [0, 0.14, 0.22, 1],
    opacityRange: [1, 1, 0, 0],
    yRange: [0, 0, -20, -20],
  },
  {
    scene: 'keys',
    label: '02 · CONTROL',
    title: 'A key with exactly the access it needs.',
    body: 'Limit models, quota, expiry, and source IP without changing the client workflow.',
    inputRange: [0, 0.14, 0.22, 0.34, 0.42, 1],
    opacityRange: [0, 0, 1, 1, 0, 0],
    yRange: [24, 24, 0, 0, -20, -20],
  },
  {
    scene: 'logs',
    label: '03 · OBSERVE',
    title: 'Every request stays understandable.',
    body: 'Inspect tokens, latency, cost, status, and Request ID without storing prompt or response bodies.',
    inputRange: [0, 0.34, 0.42, 0.54, 0.62, 1],
    opacityRange: [0, 0, 1, 1, 0, 0],
    yRange: [24, 24, 0, 0, -20, -20],
  },
  {
    scene: 'issuance',
    label: '04 · ISSUE',
    title: 'Issue access without manual setup.',
    body: 'Choose a profile, set quota and expiry, and deliver a sanitized client configuration in one flow.',
    inputRange: [0, 0.54, 0.62, 0.74, 0.82, 1],
    opacityRange: [0, 0, 1, 1, 0, 0],
    yRange: [24, 24, 0, 0, -20, -20],
  },
  {
    scene: 'config',
    label: '05 · DELIVER',
    title: 'Configuration that is ready to use.',
    body: 'Move from a verified model to Codex CLI, Claude Code, or an SDK with a few copied lines.',
    inputRange: [0, 0.74, 0.82, 1],
    opacityRange: [0, 0, 1, 1],
    yRange: [24, 24, 0, 0],
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
      <h2>{t(props.story.title)}</h2>
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

  return (
    <motion.div style={{ opacity }}>
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
            <h2>{t(story.title)}</h2>
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
    [0, 0.16, 0.84, 1],
    [0.86, 1, 1, 0.92]
  )
  const frameY = useTransform(
    scrollYProgress,
    [0, 0.16, 0.84, 1],
    [54, 0, 0, -36]
  )
  const frameRadius = useTransform(scrollYProgress, [0, 0.18], [28, 16])
  const indicatorWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

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
        <div className='iterloop-story-progress'>
          <motion.span style={{ width: indicatorWidth }} />
        </div>
      </div>
    </section>
  )
}
