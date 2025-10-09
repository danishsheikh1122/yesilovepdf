'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ToolCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  gradient: string
}

export default function ToolCard({ title, description, icon, href, gradient }: ToolCardProps) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-500 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
            {description}
          </p>
          <Button 
            variant="ghost" 
            className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 justify-between"
          >
            Try it now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}