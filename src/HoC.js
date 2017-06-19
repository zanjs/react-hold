import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {
  isNull, isObject, isFunction,
  getNodeSize, getComputedStyle, getDisplayName,
  addHandler, removeHandler,
} from './utils'
import Fill from './holders/Fill'
import createRefiter from './createRefiter'

const $nbsp = '\u00A0'
const blankLength = 8
const window = global
const envStyle = {
  position: 'relative',
  padding: '0px',
  margin: '0px',
  width: '100%',
  height: '100%',
  border: 'none',
  overflow: 'visible',
}

/**
 * Hold the target component,
 * returns a holdable higher-order component.
 *
 * @param {Component} targetComponent
 * @param {Function} condition
 * @param {Component} holder
 * @param {Object} holderProps
 * @returns {Component}
 */
export default function (targetComponent, condition, holder = Fill, holderProps = {}) {
  if (!isFunction(targetComponent) && typeof targetComponent !== 'string') {
    throw new TypeError('Expected the target component to be a react or dom component.')
  }

  if (!isFunction(condition)) {
    throw new TypeError('Expected the hold condition to be a function.')
  }

  if (isObject(holder)) {
    holderProps = holder
    holder = Fill
  }

  holderProps.color = holderProps.color || '#eee'
  holderProps.width = !isNull(holderProps.width) ? holderProps.width : null
  holderProps.height = !isNull(holderProps.height) ? holderProps.height : null

  const wrappedComponentName = getDisplayName(targetComponent)

  const refiter = createRefiter(targetComponent)

  class Hold extends Component {

    constructor(...args) {
      super(...args)

      this.state = {
        hold: true,
        copy: true,
        color: holderProps.color, // holder's color
        width: holderProps.width, // holder's width
        height: holderProps.height, // holder's height
      }
      // The style value of original node
      this.originNodeStyle = null
      // window resize handler
      this.resizeHandler = () => {
        if (this.state.hold) {
          this.updateHolderSizeIfNecessary()
        }
      }
    }

    componentWillMount() {
      if (condition.call(null, this.props, {})) {
        refiter.refit()
      } else {
        this.cancelHold()
      }
    }

    componentDidMount() {
      if (this.state.hold) {
        this.originNodeStyle = this.computeOriginNodeStyle()
        this.setState({ copy: false })
      }

      addHandler(window, 'resize', this.resizeHandler)
    }

    componentWillReceiveProps(nextProps) {
      if (condition.call(null, nextProps, this.props)) {
        this.setState({
          hold: true,
          copy: true,
        })
      } else {
        this.cancelHold()
      }
    }

    componentDidUpdate() {
      if (this.state.hold) {
        if (this.state.copy) {
          refiter.refit()
          this.originNodeStyle = this.computeOriginNodeStyle()
          this.setState({ copy: false })
        } else if (!isNull(this.originNodeStyle)) {
          this.setFakeNodeStyle(this.originNodeStyle)
          this.updateHolderSizeIfNecessary()
          this.originNodeStyle = null
        }
      }
    }

    componentWillUnmount() {
      removeHandler(window, 'resize', this.resizeHandler)
    }

    setFakeNodeStyle(style) {
      if (!isObject(style)) return

      const fake = this.refs.fake
      // hidden element
      fake.style.display = 'none'
      // set style
      Object.keys(style).forEach((name) => {
        if (name !== 'display') {
          fake.style[name] = style[name]
        }
      })
      // fix style
      fake.style.opacity = 1
      fake.style.background = 'transparent'
      fake.style.borderColor = 'transparent'
      fake.style.display = style.display === 'inline' ? 'inline-block' : style.display
    }

    computeOriginNodeStyle() {
      let result = null
      const originNode = findDOMNode(this)

      // store original display property
      let computedStyle = getComputedStyle(originNode, null)
      const originDisplay = computedStyle.getPropertyValue('display')

      // set display to 'none' before recompute is very **important**,
      // don't remove or move this step!
      originNode.style.display = 'none'
      // compute node style
      computedStyle = getComputedStyle(originNode, null)

      Object.keys(computedStyle).forEach((key) => {
        if (/[0-9]+/.test(key)) {
          const name = computedStyle[key]
          result = result || {}
          if (name === 'display') {
            result[name] = originDisplay
          } else {
            result[name] = computedStyle.getPropertyValue(name)
          }
        }
      })

      // if node is img, set overflow to 'hidden'
      if (originNode.tagName === 'IMG') {
        result.overflow = 'hidden'
      }

      return result
    }

    cancelHold() {
      refiter.undo()
      this.setState({ hold: false })
    }

    updateHolderSizeIfNecessary() {
      const { env } = this.refs
      if (!env) return
      if (!isNull(holderProps.width) && !isNull(holderProps.height)) return

      const size = getNodeSize(env)
      const width = isNull(holderProps.width) ? size.width : holderProps.width
      const height = isNull(holderProps.height) ? size.height : holderProps.height
      if (this.state.width !== width || this.state.height !== height) {
        this.setState({
          width,
          height,
        })
      }
    }

    render() {
      const { hold, copy, color, width, height } = this.state

      if (!hold || copy) {
        const { innerRef, ...propsForElement } = this.props
        if (innerRef && !hold) propsForElement.ref = innerRef
        return React.createElement(targetComponent, propsForElement)
      }

      const propsForHolder = { ...holderProps, color, width, height }
      if (typeof propsForHolder.children === 'string') {
        propsForHolder.children = propsForHolder.children.replace(/ /g, $nbsp)
      }
      propsForHolder.children = propsForHolder.children || $nbsp.repeat(blankLength)

      return (
        <div ref="fake">
          <div ref="env" style={envStyle}>
            { React.createElement(holder, propsForHolder) }
          </div>
        </div>
      )
    }
  }

  hoistNonReactStatic(Hold, targetComponent)

  Hold.displayName = `Hold(${wrappedComponentName})`

  Hold.propTypes = {
    innerRef: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }

  Hold.defaultProps = {
    innerRef: null,
  }

  return Hold
}
