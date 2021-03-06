import React from 'react'
import PropTypes from 'prop-types'
import shapes from '../shapes'
import { CENTER } from '../align'

const Fill = ({ color, width, height, children, align, fillerStyle }) => {
  const lineHeight = (typeof height === 'string' && height.trim()) ?
    height : typeof height === 'number' ?
    `${height}px` : null

  return (
    <div style={{ textAlign: align }}>
      <div
        style={{
          background: color,
          ...fillerStyle,
          display: 'inline-block',
          textAlign: 'center',
          width,
          height,
          lineHeight,
        }}
      >
        { children }
      </div>
    </div>
  )
}

Fill.propTypes = {
  ...shapes,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  align: PropTypes.string,
}

Fill.defaultProps = {
  width: null,
  height: null,
  align: CENTER,
  fillerStyle: null,
}

export default Fill
