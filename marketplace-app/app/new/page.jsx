"use client";
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import DatePicker from 'antd/es/date-picker';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Space from 'antd/es/space';
import dayjs from 'dayjs';
import { useState } from 'react';

export default function NewJobPage() {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description,
        requirements: values.requirements,
        posterName: values.posterName,
        posterContact: values.posterContact,
        expiresAt: values.expiresAt?.toISOString(),
      };
      const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      message.success('Job posted');
      form.resetFields();
    } catch (e) {
      console.error(e);
      message.error('Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Publish a New Job" style={{ maxWidth: 900, margin: '0 auto' }}>
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
        initialValues={{
          expiresAt: dayjs().add(2, 'day'),
        }}
      >
        <Form.Item name="title" label="Job title" rules={[{ required: true, message: 'Please enter a title' }]}> 
          <Input placeholder="Short title" maxLength={200} showCount />
        </Form.Item>
        <Form.Item name="description" label="Job description" rules={[{ required: true, message: 'Please enter a description' }]}> 
          <Input.TextArea rows={6} maxLength={16 * 1024} showCount placeholder="Describe the job" />
        </Form.Item>
        <Form.Item name="requirements" label="Job requirements" rules={[{ required: true, message: 'Please enter requirements' }]}> 
          <Input.TextArea rows={6} maxLength={16 * 1024} showCount placeholder="List requirements" />
        </Form.Item>
        <Space size="large" style={{ width: '100%' }} direction="vertical">
          <Form.Item name="posterName" label="Your name" rules={[{ required: true, message: 'Your name is required' }]}> 
            <Input placeholder="John Doe" maxLength={120} />
          </Form.Item>
          <Form.Item name="posterContact" label="Contact info" rules={[{ required: true, message: 'Contact info is required' }]}> 
            <Input placeholder="Email or phone" maxLength={200} />
          </Form.Item>
          <Form.Item name="expiresAt" label="Auction expires" rules={[{ required: true, message: 'Please set an expiration' }]}> 
            <DatePicker showTime style={{ width: '100%' }} disabledDate={(d)=> d && d < dayjs().startOf('day')} />
          </Form.Item>
        </Space>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Publish Job
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
