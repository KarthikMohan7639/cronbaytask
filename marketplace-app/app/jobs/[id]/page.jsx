"use client";
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Descriptions from 'antd/es/descriptions';
import Form from 'antd/es/form';
import InputNumber from 'antd/es/input-number';
import List from 'antd/es/list';
import message from 'antd/es/message';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id;
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const jobData = await res.json();
      setJob(jobData);
      const bidsRes = await fetch(`/api/jobs/${id}/bids`);
      setBids(await bidsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchJob();
    const t = setInterval(fetchJob, 10000);
    return () => clearInterval(t);
  }, [id]);

  const timeRemaining = useMemo(() => {
    if (!job) return '-';
    const d = dayjs(job.expiresAt);
    const now = dayjs();
    if (d.isBefore(now) || job.status !== 'open') return 'Expired';
    return d.fromNow();
  }, [job]);

  const onBid = async (values) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}/bids`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(values.amount) }) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to place bid');
      }
      message.success('Bid placed');
      fetchJob();
    } catch (e) {
      console.error(e);
      message.error(e.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card loading={loading} title={job.title || 'Job'} extra={<Tag color={job.status === 'open' ? 'green' : 'red'}>{job.status}</Tag>}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Poster">{job.posterName} · {job.posterContact}</Descriptions.Item>
          <Descriptions.Item label="Published">{dayjs(job.publishedAt).format('MMM D, YYYY h:mm A')}</Descriptions.Item>
          <Descriptions.Item label="Expires">{dayjs(job.expiresAt).format('MMM D, YYYY h:mm A')} ({timeRemaining})</Descriptions.Item>
          <Descriptions.Item label="Lowest bid">{job.lowestBid != null ? `$${job.lowestBid.toFixed(2)}` : '—'}</Descriptions.Item>
          <Descriptions.Item label="Bids count">{job.bidsCount}</Descriptions.Item>
          <Descriptions.Item label="Description">{job.description}</Descriptions.Item>
          <Descriptions.Item label="Requirements">{job.requirements}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Place a bid" disabled={job.status !== 'open'}>
        {job.status !== 'open' ? (
          <Text type="secondary">Bidding is closed.</Text>
        ) : (
          <Form layout="inline" onFinish={onBid}>
            <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Enter a bid' }]}> 
              <InputNumber min={1} prefix="$" step={1} precision={2} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting}>Place bid</Button>
            </Form.Item>
          </Form>
        )}
      </Card>

      <Card title={`Bids (${bids.length})`}>
        <List
          dataSource={bids}
          renderItem={(b) => (
            <List.Item>
              <List.Item.Meta
                title={`$${b.amount.toFixed(2)}`}
                description={<Text type="secondary">{dayjs(b.createdAt).fromNow()}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
