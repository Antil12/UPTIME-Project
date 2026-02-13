// export default function StatPopup({ type, urls, upCount, downCount, onClose, theme }) {
  
//   const titleGradient = {
//     total: "from-purple-400 via-pink-400 to-red-400",
//     up: "from-green-400 via-green-300 to-green-200",
//     down: "from-red-500 via-red-400 to-red-300",
//     uptime: "from-blue-400 via-indigo-400 to-purple-400",
//   };

//   const titleText = {
//     total: "🌐 Total Websites",
//     up: "🟢 Websites UP",
//     down: "🔴 Websites DOWN",
//     uptime: "📊 Uptime Summary",
//   };

//   return (
//     <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//       <div
//   className={`
//     relative
//     w-[90%] max-w-[280px] md:max-w-md
//     mx-auto
//     rounded-xl md:rounded-3xl
//     p-3 md:p-6
//     border
//     backdrop-blur-xl
//     shadow-2xl
//     transition-all duration-300 md:hover:scale-105
//     ${theme === "dark"
//       ? "bg-white/10 border-white/20 text-white"
//       : "bg-white border-gray-200 text-gray-800"
//     }
//   `}
// >
// </div>
      

//       <div className={`
//         relative 
// w-full
// max-w-[260px] sm:max-w-sm md:max-w-md
// rounded-xl md:rounded-3xl
// p-3 sm:p-5 md:p-6
// border

//         ${theme === "dark" ? "bg-gray-800/70 border-gray-700 text-white" : "bg-white/50 border-white/30 text-black"}
//         backdrop-blur-lg shadow-2xl ring-1 ring-white/20
//        transition-all duration-300 md:hover:scale-105

//       `}>
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 md:top-4 md:right-5 text-sm md:text-lg text-gray-700 dark:text-gray-200 hover:text-red-500 transition-all shadow-md p-1 rounded-full bg-white/20 backdrop-blur-sm"

//         >
          
//         </button>

//         {/* Title */}
//         <h2 className={`
//           text-2xl md:text-3xl font-extrabold mb-6 text-transparent bg-clip-text
//           bg-gradient-to-r ${titleGradient[type]} drop-shadow-xl
//           animate-pulse
//         `}>
//           {titleText[type]}
//         </h2>

//         {/* Content */}
//         {type === "total" && (
//           <>
//             {urls.length === 0
//               ? <p className="text-gray-400">No websites added yet</p>
//               : urls.map(u => (
//                   <div key={u.id} className="mb-1 hover:text-purple-400 transition-colors">
//                     • {u.domain}
//                   </div>
//                 ))
//             }
//           </>
//         )}

//         {type === "up" && (
//           <>
//             {urls.filter(u => u.status === "UP").map(u => (
//               <p key={u.id} className="mb-1 hover:text-green-300 transition-colors">• {u.domain}</p>
//             ))}
//           </>
//         )}

//         {type === "down" && (
//           <>
//             {urls.filter(u => u.status === "DOWN").map(u => (
//               <p key={u.id} className="mb-1 hover:text-red-300 transition-colors">• {u.domain}</p>
//             ))}
//           </>
//         )}

//         {type === "uptime" && (
//           <div className="space-y-2">
//             <p>Total Websites: <span className="font-bold">{urls.length}</span></p>
//             <p className="text-green-400">UP: <span className="font-bold">{upCount}</span></p>
//             <p className="text-red-400">DOWN: <span className="font-bold">{downCount}</span></p>
//             <p className="font-extrabold text-xl mt-4 text-yellow-400 animate-pulse">
//               Overall Uptime: {urls.length === 0 ? "0%" : `${Math.round((upCount / urls.length) * 100)}%`}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
