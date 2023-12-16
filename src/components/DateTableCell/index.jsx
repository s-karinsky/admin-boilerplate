import React from 'react';
import { CalendarOutlined } from '@ant-design/icons';
export const DateTableCell = ({ date }) => {
  return (
    <div style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
      {date !== '' && <CalendarOutlined style={{ marginRight: 5 }} />}

      {typeof date === 'string' ? date : date.toLocaleDateString()}
    </div>
  );
};
