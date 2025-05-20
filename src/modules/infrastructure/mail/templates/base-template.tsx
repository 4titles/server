import * as React from 'react'

import { COMPANY_NAME } from '@/shared/constants/company.constants'
import {
    Body,
    Container,
    Font,
    Head,
    Html,
    Preview,
    Section,
    Tailwind,
} from '@react-email/components'
import { TEMPLATE_COLORS } from './constants/colors.constants'

interface BaseTemplateProps {
    children: React.ReactNode
    preview: string
    companyName?: string
}

export const BaseTemplate = ({
    children,
    preview,
    companyName = COMPANY_NAME,
}: BaseTemplateProps) => {
    const fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'

    return (
        <Html lang="ru">
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <meta
                    httpEquiv="Content-Type"
                    content="text/html; charset=UTF-8"
                />
                <Font
                    fontFamily="Roboto"
                    fallbackFontFamily="Helvetica"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>{preview}</Preview>
            <Tailwind>
                <Body
                    style={{
                        backgroundColor: TEMPLATE_COLORS.background,
                        margin: 0,
                        padding: 0,
                        WebkitTextSizeAdjust: '100%',
                        textSizeAdjust: '100%',
                        fontFamily,
                        lineHeight: '1.5',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Container
                        style={{
                            maxWidth: '600px',
                            margin: '0 auto',
                            padding: '24px 20px',
                        }}
                    >
                        <Section
                            style={{
                                backgroundColor: TEMPLATE_COLORS.cardBackground,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                border: `1px solid ${TEMPLATE_COLORS.border}`,
                                WebkitBorderRadius: '8px',
                                MozBorderRadius: '8px',
                            }}
                        >
                            <Section
                                style={{
                                    padding: '32px',
                                }}
                            >
                                {children}
                            </Section>
                        </Section>

                        <Section
                            style={{
                                textAlign: 'center',
                                color: TEMPLATE_COLORS.mutedForeground,
                                fontSize: '12px',
                                padding: '16px 0 0',
                                margin: '0',
                            }}
                        >
                            &copy; {new Date().getFullYear()} {companyName}. Все
                            права защищены.
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    )
}
