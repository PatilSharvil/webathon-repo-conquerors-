import RiskAssessment from '../models/RiskAssessment.js';
import Property from '../models/Property.js';

class RiskEngine {
  async assess(propertyId) {
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const score = this.calculateScore(property);
    const factors = this.detectFactors(property);
    const insights = this.generateInsights(factors);
    const temporalData = this.buildTemporalData(property);
    const riskLevel = this.scoreToRiskLevel(score);
    const explanation = this.generateExplanation(score, factors, riskLevel);

    const assessment = await RiskAssessment.create({
      propertyId,
      score,
      riskLevel,
      factors,
      insights,
      temporalData,
      explanation
    });

    return assessment;
  }

  calculateScore(property) {
    let score = 100; // Start clean, deduct for risks

    // Frequent ownership transfers (red flag)
    const recentTransfers = property.ownershipHistory.filter(
      o => (Date.now() - new Date(o.transferDate).getTime()) < 5 * 365 * 24 * 60 * 60 * 1000
    );
    if (recentTransfers.length > 2) score -= 25;
    else if (recentTransfers.length > 1) score -= 15;
    else if (recentTransfers.length === 1) score -= 5;

    // Active loans
    const activeLoans = property.loans.filter(l => l.status === 'active');
    score -= activeLoans.length * 10;

    // Active disputes (major red flag)
    const activeDisputes = property.disputes.filter(d => d.status !== 'resolved');
    score -= activeDisputes.length * 20;

    // Ownership change with loan overlap
    const hasLoanOverlap = property.loans.some(loan =>
      property.ownershipHistory.some(ownership =>
        Math.abs(new Date(loan.startDate) - new Date(ownership.transferDate)) < 180 * 24 * 60 * 60 * 1000
      )
    );
    if (hasLoanOverlap) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  detectFactors(property) {
    const factors = [];
    const recentTransfers = property.ownershipHistory.filter(
      o => (Date.now() - new Date(o.transferDate).getTime()) < 5 * 365 * 24 * 60 * 60 * 1000
    );

    if (recentTransfers.length > 2) {
      factors.push({
        type: 'Frequent Ownership Transfers',
        severity: 'high',
        description: `Property changed owners ${recentTransfers.length} times in last 5 years`,
        evidence: recentTransfers.map(o => `${o.ownerName} (${new Date(o.transferDate).getFullYear()})`)
      });
    }

    const activeLoans = property.loans.filter(l => l.status === 'active');
    if (activeLoans.length > 0) {
      factors.push({
        type: 'Active Loans',
        severity: activeLoans.length > 1 ? 'high' : 'medium',
        description: `${activeLoans.length} active loan(s) on property`,
        evidence: activeLoans.map(l => `${l.lender}: ₹${l.amount}`)
      });
    }

    const activeDisputes = property.disputes.filter(d => d.status !== 'resolved');
    if (activeDisputes.length > 0) {
      factors.push({
        type: 'Legal Disputes',
        severity: 'high',
        description: `${activeDisputes.length} active dispute(s)`,
        evidence: activeDisputes.map(d => d.description || d.type)
      });
    }

    const hasLoanOverlap = property.loans.some(loan =>
      property.ownershipHistory.some(ownership =>
        Math.abs(new Date(loan.startDate) - new Date(ownership.transferDate)) < 180 * 24 * 60 * 60 * 1000
      )
    );
    if (hasLoanOverlap) {
      factors.push({
        type: 'Loan-Ownership Overlap',
        severity: 'medium',
        description: 'Loan taken close to ownership transfer date',
        evidence: ['Potential suspicious transaction pattern']
      });
    }

    return factors;
  }

  generateInsights(factors) {
    const insights = [];
    if (factors.find(f => f.type === 'Frequent Ownership Transfers')) {
      insights.push('Frequent ownership transfers detected - verify legitimacy');
    }
    if (factors.find(f => f.type === 'Active Loans')) {
      insights.push('Active loans present - may affect clear title');
    }
    if (factors.find(f => f.type === 'Legal Disputes')) {
      insights.push('Legal disputes active - potential ownership conflict');
    }
    if (factors.find(f => f.type === 'Loan-Ownership Overlap')) {
      insights.push('Loan overlaps with ownership change - potential suspicious pattern');
    }
    if (insights.length === 0) {
      insights.push('No significant risk factors identified');
    }
    return insights;
  }

  buildTemporalData(property) {
    const events = [];
    let cumulativeScore = 100;

    // Ownership events
    property.ownershipHistory.forEach(o => {
      cumulativeScore -= 5;
      events.push({
        date: o.transferDate,
        event: `Ownership transferred to ${o.ownerName}`,
        riskDelta: -5,
        cumulativeScore: Math.max(0, cumulativeScore)
      });
    });

    // Loan events
    property.loans.forEach(l => {
      cumulativeScore -= 10;
      events.push({
        date: l.startDate,
        event: `Loan taken from ${l.lender} (₹${l.amount})`,
        riskDelta: -10,
        cumulativeScore: Math.max(0, cumulativeScore)
      });
    });

    // Dispute events
    property.disputes.forEach(d => {
      cumulativeScore -= 20;
      events.push({
        date: d.filedDate,
        event: `Dispute filed: ${d.description || d.type}`,
        riskDelta: -20,
        cumulativeScore: Math.max(0, cumulativeScore)
      });
    });

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  scoreToRiskLevel(score) {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Critical';
  }

  generateExplanation(score, factors, riskLevel) {
    let explanation = `This property has a ${riskLevel.toLowerCase()} risk level with a score of ${score}/100. `;
    if (factors.length === 0) {
      explanation += 'No significant risk factors were detected in the property records.';
    } else {
      explanation += `Risk factors detected: ${factors.map(f => f.type).join(', ')}. `;
      explanation += 'Each factor was scored based on severity and impact on property title clarity.';
    }
    return explanation;
  }

  async getAssessment(propertyId) {
    return RiskAssessment.findOne({ propertyId }).sort({ createdAt: -1 });
  }
}

export default new RiskEngine();
