/**
 * Created by toplan on 17/6/9.
 */
import React from 'react'
import { holdable } from 'react-hold' //try use decorator

const H = ({ size, className, style, children }) => {
  size = Math.ceil(size)
  if (size < 1) size = 1
  if (size > 6) size = 6
  return React.createElement(`h${size}`, {
    className,
    style,
    children,
  })
}

H.defaultProps = {
  size: 1,
}

const holdCondition = (props, prevProps) => !props.children

const withHolder = (holder, props = {}) => holdable(holdCondition, holder, props)(H)

const H1 = withHolder()

H1.withHolder = withHolder

export default H1