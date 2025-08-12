import React, { useState } from 'react'
import MoodPlayer from './components/MoodPlayer'


const App = () => {
   const [songs,setSongs] = useState([])

  return (
    <div>
      <MoodPlayer songs={songs} setSongs={setSongs} />
    </div>
  )
}

export default App