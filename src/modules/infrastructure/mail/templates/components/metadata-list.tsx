import * as React from 'react'

import { TEMPLATE_COLORS } from '../constants/colors.constants'
import type { TransformedLocationInfo } from '../utils/transform-metadata.util'

interface MetadataListProps {
    metadata: TransformedLocationInfo
}

export const MetadataList = ({ metadata }: MetadataListProps) => {
    const items = [
        { label: 'Расположение', value: metadata.location },
        { label: 'ОС', value: metadata.os },
        { label: 'Браузер', value: metadata.browser },
        { label: 'Устройство', value: metadata.device },
        { label: 'IP-адрес', value: metadata.ip },
    ].filter((item) => item.value !== null)

    return (
        <table
            style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: 'none',
                borderSpacing: 0,
                marginBottom: '8px',
                marginTop: '8px',
            }}
            cellPadding="0"
            cellSpacing="0"
        >
            <tbody>
                {items.map(({ label, value }) => (
                    <tr key={label}>
                        <td
                            style={{
                                textAlign: 'left',
                                verticalAlign: 'top',
                                paddingBottom: '8px',
                                paddingRight: '12px',
                                color: TEMPLATE_COLORS.textPrimary,
                                fontSize: '14px',
                                fontWeight: 600,
                                minWidth: '120px',
                            }}
                        >
                            {label}:
                        </td>
                        <td
                            style={{
                                textAlign: 'left',
                                verticalAlign: 'top',
                                paddingBottom: '8px',
                                color: TEMPLATE_COLORS.textPrimary,
                                fontSize: '14px',
                            }}
                        >
                            {value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
