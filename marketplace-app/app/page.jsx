"use client";
import Card from 'antd/es/card';
import Col from 'antd/es/col';
import List from 'antd/es/list';
import Row from 'antd/es/row';
import Space from 'antd/es/space';
import Spin from 'antd/es/spin';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { useEffect, useState } from 'react';

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function HomePage() {
  const [recent, setRecent] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [recentRes, activeRes] = await Promise.all([
          fetch('/api/jobs?sort=publishedAt:desc&limit=10').then(r=>r.json()),
          fetch('/api/jobs/active?limit=10').then(r=>r.json()),
        ]);
        if (!mounted) return;
        setRecent(recentRes);
        setActive(activeRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Newest Jobs">
            <List
              itemLayout="vertical"
              dataSource={recent}
              renderItem={(job) => (
                <List.Item key={job.id}
                  extra={<Tag color={job.status === 'open' ? 'green' : 'red'}>{job.status}</Tag>}
                >
                  <List.Item.Meta
                    title={<Link href={`/jobs/${job.id}`}>{job.title || 'Untitled Job'}</Link>}
                    description={
                      <Text type="secondary">
                        Posted {dayjs(job.publishedAt).fromNow()} · Bids: {job.bidsCount || 0}
                      </Text>
                    }
                  />
                  <Text>{job.description?.slice(0, 160)}{job.description?.length > 160 ? '…' : ''}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Most Active Open Jobs">
            <List
              itemLayout="vertical"
              dataSource={active}
              renderItem={(job) => (
                <List.Item key={job.id}
                  extra={<Tag color="blue">{job.bidsCount} bids</Tag>}
                >
                  <List.Item.Meta
                    title={<Link href={`/jobs/${job.id}`}>{job.title || 'Untitled Job'}</Link>}
                    description={
                      <Text type="secondary">
                        Expires {dayjs(job.expiresAt).format('MMM D, YYYY h:mm A')}
                      </Text>
                    }
                  />
                  <Text>Lowest bid: {job.lowestBid != null ? `$${job.lowestBid.toFixed(2)}` : '—'}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
