import React from 'react';

const Router = ({ currentPage, children }) => {
  return children.find(child => child.props.name === currentPage) || children[0]
}

const Page = ({ name, children }) => children

export default Router
export { Page }