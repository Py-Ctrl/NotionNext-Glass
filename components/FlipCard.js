import React from 'react'

/**
 * 翻转组件
 * @param {*} props
 * @returns
 */
export default function FlipCard(props) {
  return (
    <div className='flip-card'>
      <div className='flip-card-inner'>
        <div className={`flip-card-front ${props.className || ''}`}>
          {props.frontContent}
        </div>
        <div className={`flip-card-back ${props.className || ''}`}>
          {props.backContent}
        </div>
      </div>
      <style jsx>{`
        .flip-card {
          width: 100%;
          height: 100%;
          display: inline-block;
          position: relative;
          perspective: 1200px;
          isolation: isolate;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          /* 这里不再常驻 will-change：卡片列表里每张卡都会常驻一个合成层。
             改到下面的 :hover 规则里，只在真正要翻牌时提升 */
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
          overflow: hidden;
        }

        .flip-card-front {
          z-index: 2;
          transform: rotateY(0deg) translateZ(1px);
          -webkit-transform: rotateY(0deg) translateZ(1px);
          pointer-events: auto;
        }

        .flip-card-back {
          transform: rotateY(180deg) translateZ(1px);
          -webkit-transform: rotateY(180deg) translateZ(1px);
          z-index: 3;
          pointer-events: none;
        }

        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
          -webkit-transform: rotateY(180deg);
          /* 只在 hover 期间提升合成层：hover 早于 transition 触发，
             足够在动画开始前完成提升，又不会让每张卡常驻一层 */
          will-change: transform;
        }

        .flip-card:hover .flip-card-front {
          pointer-events: none;
        }

        .flip-card:hover .flip-card-back {
          pointer-events: auto;
        }
      `}</style>
    </div>
  )
}
