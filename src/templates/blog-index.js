import React from 'react'
import Layout from '../components/layout'
import BlogPostList from '../components/blog-post-list'

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props

    return (
      <Layout location={data.location} title={data.site.siteMetadata.title}>
        <BlogPostList posts={data.posts.edges} />
      </Layout>
    )
  }
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    posts: allMarkdownRemark(
      filter: {
        frontmatter: {
          published: { ne: false }
        },
        fields: {
          slug: { glob: "/blog/*" }
        }
      },
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            title
            teaser
            tags
            thumbnail {
              childImageSharp {
                fluid(maxWidth: 800) {
                  ...GatsbyImageSharpFluid
                }
              }
            }
          }
        }
      }
    }
  }
`