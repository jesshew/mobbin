import { motion, useScroll, useTransform } from "framer-motion"  
import { useRef } from "react"  

export const SampleStickyCards = () => {  
  // Main container reference  
  const containerRef = useRef(null)  
    
  // Create scroll progress tracker  
  const { scrollYProgress } = useScroll({  
    target: containerRef,  
    offset: ["start start", "end end"]  
  })  
    
  // Card colors  
  const cardColors = ["#FF5733", "#33FF57", "#3357FF", "#F033FF", "#FF9933"]  
    
  // Create cards with their animations  
  const cards = cardColors.map((color, i) => {  
    // Calculate scroll ranges for this card  
    const start = i * 0.2  
    const end = start + 0.6  
      
    // Transform scroll progress into opacity and y position  
    const opacity = useTransform(  
      scrollYProgress,  
      [start, start + 0.1, end - 0.1, end],  
      [0.5, 1, 1, 0.8]  
    )  
      
    const y = useTransform(  
      scrollYProgress,  
      [start, start + 0.1, end - 0.1, end],  
      ["100vh", "0vh", "0vh", "-50vh"]  
    )  
      
    return (  
      <motion.div  
        key={`card-${i}`}  
        style={{  
          opacity,  
          y,  
          position: "fixed",  
          top: 0,  
          left: 0,  
          right: 0,  
          height: "100vh",  
          display: "flex",  
          justifyContent: "center",  
          alignItems: "center",  
          zIndex: 10 + i,  
          pointerEvents: "none"  
        }}  
      >  
        <div  
          style={{  
            width: "80%",  
            height: "80%",  
            backgroundColor: color,  
            borderRadius: "20px",  
            display: "flex",  
            justifyContent: "center",  
            alignItems: "center",  
            fontSize: "2rem",  
            color: "white"  
          }}  
        >  
          Card {i + 1}  
        </div>  
      </motion.div>  
    )  
  })  
    
  return (  
    <div   
      ref={containerRef}   
      style={{   
        height: "500vh", // Tall enough for scrolling  
        position: "relative"  
      }}  
    >  
      {cards}  
    </div>  
  )  
}