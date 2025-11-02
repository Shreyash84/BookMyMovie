import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mt-20 text-center text-gray-400 border-t border-slate-700 pt-6 pb-4"
    >
      <p className="text-sm">
        🎬 Built with ❤️ by <span className="text-red-400 font-semibold">Cinos</span>
      </p>
      <p className="text-xs mt-2 text-gray-500">
        © {new Date().getFullYear()} CinosDev All rights reserved.
      </p>
    </motion.footer>
  );
};

export default Footer;
