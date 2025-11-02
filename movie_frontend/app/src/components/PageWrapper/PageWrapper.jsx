// src/components/PageWrapper.jsx
import React from "react";
import { motion } from "framer-motion";
import Footer from "../Footer/Footer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const PageWrapper = ({ children, className = "" }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`min-h-screen flex flex-col justify-between py-16 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white ${className}`}
    >
      <main className="flex-grow">{children}</main>
      <Footer />
    </motion.div>
  );
};

export default PageWrapper;
