import Link from 'next/link'
import { QrCode, ArrowLeft, Check, X, HelpCircle, Zap, Mail, MessageSquare } from 'lucide-react'
import PricingTable from '../components/PricingTable'

const features = [
  {
    name: 'Requests per minute',
    free: '10',
    starter: '60',
    pro: '300',
    enterprise: '1,000+'
  },
  {
    name: 'Requests per month',
    free: '100',
    starter: '5,000',
    pro: '25,000',
    enterprise: '100,000+'
  },
  {
    name: 'Output formats',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
    note: 'PNG, JPEG, WebP, SVG'
  },
  {
    name: 'Custom colors',
    free: false,
    starter: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'Logo embedding',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
    note: 'Automatic error correction optimization'
  },
  {
    name: 'Custom sizes',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
    note: '100-2000px'
  },
  {
    name: 'Error correction levels',
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
    note: 'L, M, Q, H levels'
  },
  {
    name: 'Configurable margin',
    free: true,
    starter: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'Batch processing',
    free: false,
    starter: false,
    pro: true,
    enterprise: true
  },
  {
    name: 'Webhook notifications',
    free: false,
    starter: false,
    pro: true,
    enterprise: true
  },
  {
    name: 'Priority processing',
    free: false,
    starter: true,
    pro: true,
    enterprise: true
  },
  {
    name: 'SLA',
    free: false,
    starter: false,
    pro: '99.9%',
    enterprise: 'Custom'
  },
  {
    name: 'Support',
    free: 'Community',
    starter: 'Email',
    pro: 'Priority',
    enterprise: 'Dedicated'
  }
]

const faqs = [
  {
    question: 'What counts as a request?',
    answer: 'Each QR code generation counts as one request, regardless of the output format, size, or settings used.'
  },
  {
    question: 'What output formats are supported?',
    answer: 'We support PNG, JPEG, WebP, and SVG formats. PNG is the default and offers the best quality for most use cases.'
  },
  {
    question: 'Can I embed my logo in QR codes?',
    answer: 'Yes, on Starter plans and above. The API automatically adjusts error correction to ensure your logo doesn\'t interfere with QR code readability.'
  },
  {
    question: 'How fast is QR code generation?',
    answer: 'Most QR codes are generated in under 250ms. Complex operations with logo embedding may take slightly longer.'
  },
  {
    question: 'What happens if I exceed my rate limit?',
    answer: 'You\'ll receive a 429 HTTP status code. You can either wait for the limit to reset or upgrade to a higher tier.'
  },
  {
    question: 'Can I use custom colors and branding?',
    answer: 'Yes, on Starter plans and above you can customize QR code colors, background colors, and embed your logo for consistent branding.'
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes, all paid plans include a free trial period. You can cancel anytime during the trial without being charged.'
  },
  {
    question: 'How do I get a refund?',
    answer: 'Contact our support team within 30 days of purchase for a full refund, no questions asked.'
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-primary-600" />
              <span className="text-xl font-mono font-bold">QR Code API</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm hover:text-primary-600 transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include our core QR code generation functionality.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-20">
          <PricingTable />
        </div>

        {/* Feature Comparison */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-medium">Free</th>
                  <th className="text-center p-4 font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <span>Starter</span>
                      <div className="flex items-center gap-1 text-xs">
                        <Zap className="h-3 w-3" />
                        <span>Popular</span>
                      </div>
                    </div>
                  </th>
                  <th className="text-center p-4 font-medium">Pro</th>
                  <th className="text-center p-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={feature.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="p-4">
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        {feature.note && (
                          <div className="text-sm text-muted-foreground">{feature.note}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-primary-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-sm">{feature.free}</span>
                      )}
                    </td>
                    <td className="p-4 text-center bg-primary-950/20">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="h-5 w-5 text-primary-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-sm">{feature.starter}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-primary-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-sm">{feature.pro}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-primary-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-mono text-sm">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-medium">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="bg-muted rounded-lg p-8 mb-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Need something custom?</h2>
            <p className="text-muted-foreground">
              Enterprise customers get dedicated infrastructure, custom rate limits, white-label API,
              and priority support. Perfect for high-volume applications requiring guaranteed performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:sales@endpnt.dev"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Contact Sales
              </a>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Technical Questions
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-600" />
              <span>99.9% uptime SLA on Pro+</span>
            </div>
          </div>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Questions? Email us at{' '}
              <a href="mailto:support@endpnt.dev" className="text-primary-600 hover:underline">
                support@endpnt.dev
              </a>{' '}
              or check out our{' '}
              <Link href="/docs" className="text-primary-600 hover:underline">
                documentation
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}