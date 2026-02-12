// import { Filter } from "lucide-react";
// import { useState } from "react";

// const CategoryFilter = ({
//   categories = [],
//   selectedCategory,
//   onSelect,
//   theme,
// }) => {
//   const [open, setOpen] = useState(false);

//   const isActive = selectedCategory !== "ALL";

//   return (
//     <div className="relative">
//       {/* Trigger Button */}
//       <button
//         onClick={() => setOpen((v) => !v)}
//         className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition
//           ${
//             isActive
//               ? "border-blue-500 text-blue-600"
//               : theme === "dark"
//               ? "border-gray-600 text-gray-300"
//               : "border-gray-300 text-gray-600"
//           }
//         `}
//       >
//         <Filter size={14} />
//         <span>{selectedCategory}</span>

//         {isActive && (
//           <span className="w-2 h-2 rounded-full bg-blue-500" />
//         )}
//       </button>

//       {/* Dropdown */}
//       {open && (
//         <div
//           className={`absolute mt-2 w-48 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur
//             ${
//               theme === "dark"
//                 ? "bg-gray-900/90 border border-gray-700"
//                 : "bg-white/90 border border-gray-200"
//             }
//           `}
//         >
//           <div className="max-h-60 overflow-auto">
//             {categories.map((cat) => {
//               const active = cat === selectedCategory;

//               return (
//                 <button
//                   key={cat}
//                   onClick={() => {
//                     onSelect(cat);
//                     setOpen(false);
//                   }}
//                   className={`w-full px-4 py-2 text-left text-sm transition
//                     ${
//                       active
//                         ? "bg-blue-600 text-white font-semibold"
//                         : theme === "dark"
//                         ? "hover:bg-gray-800 text-gray-300"
//                         : "hover:bg-slate-100 text-gray-700"
//                     }
//                   `}
//                 >
//                   {cat}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CategoryFilter;
