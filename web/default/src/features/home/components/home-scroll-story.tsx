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

import {
  HomeConsolePreview,
  type ConsolePreviewScene,
} from './home-console-preview'

type Story = {
  scene: ConsolePreviewScene
  label: string
  title: string
  body: string
}

const STORIES: Story[] = [
  {
    scene: 'keys',
    label: '01 · CONTROL',
    title: 'A key with exactly the access it needs.',
    body: 'Limit models, quota, expiry, and source IP without changing the client workflow.',
  },
  {
    scene: 'logs',
    label: '02 · OBSERVE',
    title: 'Every request stays understandable.',
    body: 'Inspect tokens, latency, cost, status, and Request ID without storing prompt or response bodies.',
  },
  {
    scene: 'config',
    label: '03 · DELIVER',
    title: 'Configuration that is ready to use.',
    body: 'Move from a verified model to Codex CLI, Claude Code, or an SDK with a few copied lines.',
  },
]

function AnimatedStoryCopy(props: {
  story: Story
  progress: MotionValue<number>
  inputRange: number[]
  opacityRange: number[]
  yRange: number[]
}) {
  const { t } = useTranslation()
  const opacity = useTransform(
    props.progress,
    props.inputRange,
    props.opacityRange
  )
  const y = useTransform(props.progress, props.inputRange, props.yRange)

  return (
    <motion.div className='iterloop-story-copy' style={{ opacity, y }}>
      <span>{t(props.story.label)}</span>
      <h2>{t(props.story.title)}</h2>
      <p>{t(props.story.body)}</p>
    </motion.div>
  )
}

function StaticStories() {
  const { t } = useTranslation()
  return (
    <div className='iterloop-story-static'>
      {STORIES.map((story) => (
        <article key={story.scene}>
          <div>
            <span>{t(story.label)}</span>
            <h2>{t(story.title)}</h2>
            <p>{t(story.body)}</p>
          </div>
          <HomeConsolePreview scene={story.scene} />
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
  const firstOpacity = useTransform(scrollYProgress, [0, 0.28, 0.38], [1, 1, 0])
  const secondOpacity = useTransform(
    scrollYProgress,
    [0.28, 0.4, 0.62, 0.72],
    [0, 1, 1, 0]
  )
  const thirdOpacity = useTransform(scrollYProgress, [0.62, 0.74, 1], [0, 1, 1])
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
          <AnimatedStoryCopy
            story={STORIES[0]}
            progress={scrollYProgress}
            inputRange={[0, 0.26, 0.38, 1]}
            opacityRange={[1, 1, 0, 0]}
            yRange={[0, 0, -20, -20]}
          />
          <AnimatedStoryCopy
            story={STORIES[1]}
            progress={scrollYProgress}
            inputRange={[0, 0.28, 0.4, 0.6, 0.72, 1]}
            opacityRange={[0, 0, 1, 1, 0, 0]}
            yRange={[24, 24, 0, 0, -20, -20]}
          />
          <AnimatedStoryCopy
            story={STORIES[2]}
            progress={scrollYProgress}
            inputRange={[0, 0.62, 0.74, 1]}
            opacityRange={[0, 0, 1, 1]}
            yRange={[24, 24, 0, 0]}
          />
        </div>
        <motion.div
          className='iterloop-story-frame'
          style={{ scale: frameScale, y: frameY, borderRadius: frameRadius }}
        >
          <motion.div style={{ opacity: firstOpacity }}>
            <HomeConsolePreview scene='keys' />
          </motion.div>
          <motion.div style={{ opacity: secondOpacity }}>
            <HomeConsolePreview scene='logs' />
          </motion.div>
          <motion.div style={{ opacity: thirdOpacity }}>
            <HomeConsolePreview scene='config' />
          </motion.div>
        </motion.div>
        <div className='iterloop-story-progress'>
          <motion.span style={{ width: indicatorWidth }} />
        </div>
      </div>
    </section>
  )
}
