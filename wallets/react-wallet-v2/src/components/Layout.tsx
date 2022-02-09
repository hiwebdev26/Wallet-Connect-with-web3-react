import Navigation from '@/components/Navigation'
import RouteTransition from '@/components/RouteTransition'
import { Card, Container, Loading } from '@nextui-org/react'
import { Fragment, ReactNode } from 'react'

/**
 * Types
 */
interface Props {
  initialized: boolean
  children: ReactNode | ReactNode[]
}

/**
 * Container
 */
export default function Layout({ children, initialized }: Props) {
  return (
    <Container
      display="flex"
      justify="center"
      alignItems="center"
      css={{
        width: '100vw',
        height: '100vh',
        paddingLeft: 0,
        paddingRight: 0
      }}
    >
      <Card
        bordered={{ '@initial': false, '@xs': true }}
        borderWeight={{ '@initial': 'light', '@xs': 'light' }}
        css={{
          height: '100vh',
          width: '100%',
          justifyContent: initialized ? 'normal' : 'center',
          alignItems: initialized ? 'normal' : 'center',
          borderRadius: 0,
          outline: 'none',
          '@xs': {
            borderRadius: '$lg',
            height: '93vh',
            maxWidth: '450px'
          }
        }}
      >
        {initialized ? (
          <Fragment>
            <RouteTransition>
              <Card.Body
                css={{
                  padding: 2,
                  '@xs': {
                    padding: '20px'
                  }
                }}
              >
                {children}
              </Card.Body>
            </RouteTransition>

            <Card.Footer>
              <Navigation />
            </Card.Footer>
          </Fragment>
        ) : (
          <Loading />
        )}
      </Card>
    </Container>
  )
}
