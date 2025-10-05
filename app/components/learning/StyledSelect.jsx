import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function StyledSelect({ value, onValueChange, placeholder, options, iconMap }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(option => option.value === value);

    const CurrentIcon = iconMap && selectedOption ? iconMap[selectedOption.value] : null;
    
    const handleSelect = (optionValue) => {
        onValueChange(optionValue);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <motion.button
                    className="input-base w-full min-w-48"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        {CurrentIcon && <CurrentIcon className="w-4 h-4 flex-shrink-0" />}
                        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4" />
                    </motion.div>
                </motion.button>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-slate-800/95 backdrop-blur-sm border-slate-700 rounded-xl shadow-2xl w-[--radix-popover-trigger-width]">
                <div className="max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <motion.button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                                hover:bg-slate-700/50 text-slate-300 hover:text-white
                                ${value === option.value ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : ''}
                            `}
                            whileHover={{ x: 4 }}
                        >
                            {iconMap && iconMap[option.value] && React.createElement(iconMap[option.value], { className: "w-4 h-4 flex-shrink-0" })}
                            <span className="font-medium">{option.label}</span>
                             {value === option.value && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-auto w-2 h-2 bg-white rounded-full"
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}