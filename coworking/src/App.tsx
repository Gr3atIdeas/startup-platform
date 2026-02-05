import Header from './components/Layout/Header'
import Hero from './components/Hero/Hero'
import VideoShowcase from './components/VideoShowcase/VideoShowcase'
import About from './components/About/About'
import Services from './components/Services/Services'
import Gallery from './components/Gallery/Gallery'
import CtaBanner from './components/CtaBanner/CtaBanner'
import Booking from './components/Booking/Booking'
import Contacts from './components/Contacts/Contacts'
import Footer from './components/Layout/Footer'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <VideoShowcase />
        <About />
        <Services />
        <Gallery />
        <CtaBanner />
        <Booking />
        <Contacts />
      </main>
      <Footer />
    </>
  )
}

export default App
